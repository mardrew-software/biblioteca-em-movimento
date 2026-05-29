import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

let auth: GoogleAuth | null = null;
let sheets: ReturnType<typeof google.sheets> | null = null;

export function getSpreadsheetId(): string {
    const id = process.env.SPREADSHEET_ID || '';
    return id;
}

export function getSheetName(): string {
    return process.env.SHEET_NAME || 'Livros';
}

function initializeGoogleAuth() {
    if (sheets) return sheets;

    const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;

    console.log('[Google Auth] ==========================================');
    console.log('[Google Auth] Initializing...');
    console.log('[Google Auth] SPREADSHEET_ID:', SPREADSHEET_ID);
    console.log('[Google Auth] SHEET_NAME:', SHEET_NAME);
    console.log('[Google Auth] keyFile env var:', keyFile ? keyFile : 'NOT SET');
    console.log('[Google Auth] credentials env var:', credentials ? 'SET (length: ' + credentials.length + ')' : 'NOT SET');

    if (!keyFile && !credentials) {
        console.error('[Google Auth] ERROR: GOOGLE_SERVICE_ACCOUNT_KEY_FILE or GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable is required');
        return null;
    }

    try {
        if (credentials) {
            // Parse credentials from environment variable
            console.log('[Google Auth] Using credentials from environment variable');
            const parsedCredentials = JSON.parse(credentials);
            console.log('[Google Auth] client_email:', parsedCredentials.client_email);
            console.log('[Google Auth] project_id:', parsedCredentials.project_id);
            auth = new GoogleAuth({
                credentials: parsedCredentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        } else if (keyFile) {
            // Use key file - check if file exists
            console.log('[Google Auth] Using key file:', keyFile);
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.resolve(keyFile);
            console.log('[Google Auth] Full path:', fullPath);
            console.log('[Google Auth] File exists:', fs.existsSync(fullPath));

            if (fs.existsSync(fullPath)) {
                const fileContent = fs.readFileSync(fullPath, 'utf8');
                const creds = JSON.parse(fileContent);
                console.log('[Google Auth] client_email from file:', creds.client_email);
            }

            auth = new GoogleAuth({
                keyFile,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        }

        if (!auth) {
            console.error('[Google Auth] ERROR: Failed to initialize - auth is null');
            return null;
        }

        sheets = google.sheets({ version: 'v4', auth });
        console.log('[Google Auth] Successfully initialized Google Sheets client');
        console.log('[Google Auth] ==========================================');
        return sheets;
    } catch (error) {
        console.error('[Google Auth] ERROR: Failed to initialize Google Auth:', error);
        console.log('[Google Auth] ==========================================');
        return null;
    }
}

export function getSheetsClient() {
    if (!sheets) {
        return initializeGoogleAuth();
    }
    return sheets;
}

const SPREADSHEET_ID = getSpreadsheetId();
const SHEET_NAME = getSheetName();

function getSheets() {
    const sheets = getSheetsClient();
    if (!sheets) {
        throw new Error('Google Sheets client not initialized. Check your service account configuration.');
    }
    return sheets;
}

export const bookColsNumber = {
    id: 0,
    isbn: 1,
    author: 2,
    title: 3,
    subtitle: 4,
    publication_date: 5,
    description: 6,
    genres: 7,
    publisher: 8,
    collection: 9,
    city: 10,
    quantity: 11,
    rental_names: 12,
    rental_emails: 13,
    rental_dates: 14,
    rental_return_dates: 15,
    rental_status: 16,
    notes: 17,
};

export const bookColsAlphabet = {
    id: 'A',
    isbn: 'B',
    author: 'C',
    title: 'D',
    subtitle: 'E',
    publication_date: 'F',
    description: 'G',
    genres: 'H',
    publisher: 'I',
    collection: 'J',
    city: 'K',
    quantity: 'L',
    rental_names: 'M',
    rental_emails: 'N',
    rental_dates: 'O',
    rental_return_dates: 'P',
    status: 'Q',
    notes: 'Q',
};

export interface Book {
    rowId: number;
    id: string;
    isbn: string;
    author: string;
    title: string;
    subtitle: string;
    publicationDate: string;
    description: string;
    genres: string[];
    publisher: string;
    collection: string;
    city: string;
    quantity: number;
    rentals: Rental[];
    notes: string;
    quantityRented: number;
    filter: string;
}

export interface Rental {
    name: string;
    email: string;
    date: string;
    returnDate: string;
    status: string;
}

export interface Locatario {
    name: string;
    email: string;
    bookTitle: string;
    bookAuthor: string[];
    since: string;
    returnDate: string;
    status: string;
}

function parseRentals(rentals: string): string[] {
    if (!rentals || rentals === '') return [];
    return rentals.split(',');
}

function mapRentals(
    rental_names: string,
    rental_emails: string,
    rental_dates: string,
    rental_return_dates: string,
    rental_status: string
): Rental[] {
    const rentalNames = parseRentals(rental_names);
    const rentalEmails = parseRentals(rental_emails);
    const rentalDates = parseRentals(rental_dates);
    const rentalReturnDates = parseRentals(rental_return_dates);
    const rentalStatus = parseRentals(rental_status);

    return rentalNames.map((name, index) => ({
        name: name?.trim() || '',
        email: rentalEmails[index]?.trim() || '',
        date: rentalDates[index]?.trim() || '',
        returnDate: rentalReturnDates[index]?.trim() || '',
        status: rentalStatus[index]?.trim() || '',
    }));
}

function getRentals(values: string[]): Rental[] {
    const rentalNames = values[bookColsNumber.rental_names] || '';
    const rentalEmails = values[bookColsNumber.rental_emails] || '';
    const rentalDates = values[bookColsNumber.rental_dates] || '';
    const rentalReturnDates = values[bookColsNumber.rental_return_dates] || '';
    const rentalStatus = values[bookColsNumber.rental_status] || '';

    return mapRentals(rentalNames, rentalEmails, rentalDates, rentalReturnDates, rentalStatus)
        .filter(r => r.name && r.name.trim().length > 0);
}

function mapGenres(genres: string): string[] {
    if (!genres) return [];
    return genres.split(/[,\/]/).map(g => g.trim()).filter(Boolean);
}

export function mapBooks(values: string[][]): Book[] {
    if (!values || values.length < 2) return [];

    // Skip header row
    return values
        .slice(1)
        .map((b, index) => {
            const rentals = getRentals(b);
            return {
                rowId: index + 2, // +2 because row 1 is header
                id: b[bookColsNumber.id] || '',
                isbn: b[bookColsNumber.isbn] || '',
                collection: b[bookColsNumber.collection] || '',
                city: b[bookColsNumber.city] || '',
                author: b[bookColsNumber.author] || '',
                title: b[bookColsNumber.title] || '',
                subtitle: b[bookColsNumber.subtitle] || '',
                publicationDate: b[bookColsNumber.publication_date] || '',
                description: b[bookColsNumber.description] || '',
                genres: mapGenres(b[bookColsNumber.genres] || ''),
                publisher: b[bookColsNumber.publisher] || '',
                quantity: parseInt(b[bookColsNumber.quantity]) || 0,
                rentals,
                notes: b.length >= bookColsNumber.notes + 1 ? b[bookColsNumber.notes] : '',
                quantityRented: rentals.length,
                filter: `${b[bookColsNumber.title] || ''} ${b[bookColsNumber.author] || ''} ${b[bookColsNumber.isbn] || ''}`.toLowerCase(),
            };
        });
}

export async function getBooks(): Promise<Book[]> {
    try {
        const sheetsClient = getSheets();
        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_NAME,
        });

        const values = response.data.values || [];
        return mapBooks(values);
    } catch (error) {
        console.error('Error fetching books from Google Sheets:', error);
        throw new Error('Failed to fetch books. Please check your Google Sheets configuration.');
    }
}

export function getCellToUpdate(rowId: number, colName: string): string {
    return `${colName}${rowId}`;
}

export function getRentalRangeToUpdate(rowId: number): string {
    return `${getCellToUpdate(rowId, bookColsAlphabet.rental_names)}:${getCellToUpdate(rowId, bookColsAlphabet.status)}`;
}

export function getBookRangeToUpdate(rowId: number): string {
    return `${getCellToUpdate(rowId, bookColsAlphabet.isbn)}:${getCellToUpdate(rowId, bookColsAlphabet.quantity)}`;
}

export function getTotalRange(rowId: number): string {
    return `${getCellToUpdate(rowId, bookColsAlphabet.isbn)}:${getCellToUpdate(rowId, bookColsAlphabet.notes)}`;
}

function joinByComma(base: string, toAdd: string): string {
    return base.length ? `${base},${toAdd}` : toAdd;
}

function mapRentalsToRange(rentals: Rental[]): string[] {
    let rental_names = '';
    let rental_emails = '';
    let rental_dates = '';
    let rental_return_dates = '';
    let rental_status = '';

    rentals.forEach((r) => {
        rental_names = joinByComma(rental_names, r.name);
        rental_emails = joinByComma(rental_emails, r.email);
        rental_dates = joinByComma(rental_dates, r.date);
        rental_return_dates = joinByComma(rental_return_dates, r.returnDate);
        rental_status = joinByComma(rental_status, r.status);
    });

    return [rental_names, rental_emails, rental_dates, rental_return_dates, rental_status];
}

export function pushToRentalRange(oldValues: string[], newValue: Rental): string[] {
    const rentals = getRentals(oldValues);
    const maxBooks = parseInt(oldValues[bookColsNumber.quantity]) || 0;

    if (rentals.length < maxBooks) {
        rentals.push({
            name: newValue.name?.length ? newValue.name : ' ',
            email: newValue.email?.length ? newValue.email : ' ',
            date: newValue.date?.length ? newValue.date : ' ',
            returnDate: newValue.returnDate?.length ? newValue.returnDate : ' ',
            status: newValue.status?.length ? newValue.status : ' ',
        });
        return mapRentalsToRange(rentals);
    } else {
        throw new Error('Não há livros disponíveis');
    }
}

export function removeFromRentalRange(values: string[], valueToRemove: { name: string; email: string }): string[] {
    const rentals = getRentals(values);
    const filtered = rentals.filter(
        (r) =>
            (!r.email.length || r.email !== valueToRemove.email) &&
            r.name !== valueToRemove.name
    );
    return mapRentalsToRange(filtered);
}

export function mapBookToRange(book: Partial<Book>): string[] {
    return [
        `${book.id || ''}`,
        `${book.isbn || ''}`,
        `${book.collection || ''}`,
        `${book.city || ''}`,
        `${book.author || ''}`,
        `${book.title || ''}`,
        `${book.subtitle || ''}`,
        `${book.publicationDate || ''}`,
        `${book.description || ''}`,
        Array.isArray(book.genres) ? book.genres.join(', ') : (book.genres || ''),
        `${book.publisher || ''}`,
        `${book.quantity || 0}`,
    ];
}

export async function saveBook(book: Partial<Book> & { rowId?: number }): Promise<void> {
    try {
        const sheetsClient = getSheets();
        const rowId = book.rowId;
        const range = book.rowId ? getTotalRange(book.rowId) : `${SHEET_NAME}!A1`;

        if (rowId) {
            // Update existing book
            await sheetsClient.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [mapBookToRange(book)],
                },
            });
        } else {
            // Append new book
            await sheetsClient.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [mapBookToRange(book)],
                },
            });
        }
    } catch (error) {
        console.error('Error saving book to Google Sheets:', error);
        throw new Error('Failed to save book. Please check your Google Sheets configuration.');
    }
}

export async function deleteBook(rowId: number): Promise<void> {
    try {
        const sheetsClient = getSheets();
        // Clear the row
        await sheetsClient.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: getTotalRange(rowId),
        });
    } catch (error) {
        console.error('Error deleting book from Google Sheets:', error);
        throw new Error('Failed to delete book. Please check your Google Sheets configuration.');
    }
}

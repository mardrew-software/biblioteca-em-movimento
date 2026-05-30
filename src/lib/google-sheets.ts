import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

let auth: GoogleAuth | null = null;
let sheets: ReturnType<typeof google.sheets> | null = null;
let drive: ReturnType<typeof google.drive> | null = null;

export function getSpreadsheetId(): string {
    const id = process.env.SPREADSHEET_ID || '';
    return id;
}

export function getSheetName(): string {
    return process.env.SHEET_NAME || 'Livros';
}

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
];

function initializeGoogleAuth() {
    if (sheets) return sheets;

    const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;

    if (!keyFile && !credentials) {
        console.error('[Google Auth] ERROR: GOOGLE_SERVICE_ACCOUNT_KEY_FILE or GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable is required');
        return null;
    }

    try {
        if (credentials) {
            const parsedCredentials = JSON.parse(credentials);
            auth = new GoogleAuth({
                credentials: parsedCredentials,
                scopes: SCOPES,
            });
        } else if (keyFile) {
            // Use key file - check if file exists
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.resolve(keyFile);

            if (fs.existsSync(fullPath)) {
                const fileContent = fs.readFileSync(fullPath, 'utf8');
                const creds = JSON.parse(fileContent);
            }

            auth = new GoogleAuth({
                keyFile,
                scopes: SCOPES,
            });
        }

        if (!auth) {
            console.error('[Google Auth] ERROR: Failed to initialize - auth is null');
            return null;
        }

        sheets = google.sheets({ version: 'v4', auth });
        drive = google.drive({ version: 'v3', auth });
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

function getDriveClient() {
    if (!drive) {
        initializeGoogleAuth();
    }
    if (!drive) {
        throw new Error('Google Drive client not initialized. Check your service account configuration.');
    }
    return drive;
}

export async function verifyGoogleSheetAccess(email: string): Promise<boolean> {
    try {
        const driveClient = getDriveClient();
        const response = await driveClient.permissions.list({
            fileId: SPREADSHEET_ID,
            fields: 'permissions(emailAddress)',
        });
        const emails = response.data.permissions
            ?.map((p) => p.emailAddress?.toLowerCase())
            .filter(Boolean) || [];
        return emails.includes(email.toLowerCase());
    } catch (err) {
        console.error('[Google Auth] Error verifying sheet access:', err);
        return false;
    }
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
    notes: 15,
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
    notes: 'P',
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
}

export interface Reserva {
    name: string;
    email: string;
    bookTitle: string;
    bookAuthor: string[];
    since: string;
    rowId: number;
}

function parseRentals(rentals: string): string[] {
    if (!rentals || rentals === '') return [];
    return rentals.split(',');
}

function mapRentals(
    rental_names: string,
    rental_emails: string,
    rental_dates: string
): Rental[] {
    const rentalNames = parseRentals(rental_names);
    const rentalEmails = parseRentals(rental_emails);
    const rentalDates = parseRentals(rental_dates);

    return rentalNames.map((name, index) => ({
        name: name?.trim() || '',
        email: rentalEmails[index]?.trim() || '',
        date: rentalDates[index]?.trim() || ''
    }));
}

function getRentals(values: string[]): Rental[] {
    const rentalNames = values[bookColsNumber.rental_names] || '';
    const rentalEmails = values[bookColsNumber.rental_emails] || '';
    const rentalDates = values[bookColsNumber.rental_dates] || '';

    return mapRentals(rentalNames, rentalEmails, rentalDates)
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
    return `${getCellToUpdate(rowId, bookColsAlphabet.rental_names)}:${getCellToUpdate(rowId, bookColsAlphabet.rental_dates)}`;
}

export function getBookRangeToUpdate(rowId: number): string {
    return `${getCellToUpdate(rowId, bookColsAlphabet.isbn)}:${getCellToUpdate(rowId, bookColsAlphabet.quantity)}`;
}

export function getTotalRange(rowId: number): string {
    return `${getCellToUpdate(rowId, bookColsAlphabet.id)}:${getCellToUpdate(rowId, bookColsAlphabet.notes)}`;
}

function joinByComma(base: string, toAdd: string): string {
    return base.length ? `${base},${toAdd}` : toAdd;
}

function mapRentalsToRange(rentals: Rental[]): string[] {
    let rental_names = '';
    let rental_emails = '';
    let rental_dates = '';

    rentals.forEach((r) => {
        rental_names = joinByComma(rental_names, r.name);
        rental_emails = joinByComma(rental_emails, r.email);
        rental_dates = joinByComma(rental_dates, r.date);
    });

    return [rental_names, rental_emails, rental_dates];
}

export function pushToRentalRange(oldValues: string[], newValue: Rental): string[] {
    const rentals = getRentals(oldValues);
    const maxBooks = parseInt(oldValues[bookColsNumber.quantity]) || 0;

    if (rentals.length < maxBooks) {
        rentals.push({
            name: newValue.name?.length ? newValue.name : ' ',
            email: newValue.email?.length ? newValue.email : ' ',
            date: newValue.date?.length ? newValue.date : ' '
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
        `${book.id || ''}`,                            // 0: id
        `${book.isbn || ''}`,                          // 1: isbn
        `${book.author || ''}`,                        // 2: author
        `${book.title || ''}`,                         // 3: title
        `${book.subtitle || ''}`,                      // 4: subtitle
        `${book.publicationDate || ''}`,               // 5: publication_date
        `${book.description || ''}`,                   // 6: description
        Array.isArray(book.genres) ? book.genres.join(', ') : (book.genres || ''), // 7: genres
        `${book.publisher || ''}`,                     // 8: publisher
        `${book.collection || ''}`,                    // 9: collection
        `${book.city || ''}`,                          // 10: city
        `${book.quantity || 0}`,                       // 11: quantity
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

export async function getReservas(): Promise<Reserva[]> {
    try {
        const books = await getBooks();
        const reservas: Reserva[] = [];

        books.forEach(book => {
            book.rentals.forEach(rental => {
                reservas.push({
                    name: rental.name,
                    email: rental.email,
                    bookTitle: book.title,
                    bookAuthor: [book.author],
                    since: rental.date,
                    rowId: book.rowId
                });
            });
        });

        return reservas;
    } catch (error) {
        console.error('Error fetching reservas:', error);
        throw new Error('Failed to fetch reservas.');
    }
}

export async function returnBook(rowId: number, rental: { name: string; email: string }): Promise<void> {
    try {
        const sheetsClient = getSheets();

        // Get current row data
        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!${getCellToUpdate(rowId, bookColsAlphabet.id)}:${getCellToUpdate(rowId, bookColsAlphabet.notes)}`,
        });

        const row = response.data.values?.[0];
        if (!row) {
            throw new Error('Row not found');
        }

        // Remove the rental from the row
        const newRentalValues = removeFromRentalRange(row, rental);

        // Update the rental columns
        await sheetsClient.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!${getCellToUpdate(rowId, bookColsAlphabet.rental_names)}:${getCellToUpdate(rowId, bookColsAlphabet.rental_dates)}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[newRentalValues[0], newRentalValues[1], newRentalValues[2]]],
            },
        });
    } catch (error) {
        console.error('Error returning book:', error);
        throw new Error('Failed to return book. Please check your Google Sheets configuration.');
    }
}

export async function rentBook(rowId: number, rental: Rental): Promise<void> {
    try {
        const sheetsClient = getSheets();

        // Get current row data
        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!${getCellToUpdate(rowId, bookColsAlphabet.id)}:${getCellToUpdate(rowId, bookColsAlphabet.notes)}`,
        });

        const row = response.data.values?.[0];
        if (!row) {
            throw new Error('Row not found');
        }

        // Add the rental to the row
        const newRentalValues = pushToRentalRange(row, rental);

        // Update the rental columns
        await sheetsClient.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!${getCellToUpdate(rowId, bookColsAlphabet.rental_names)}:${getCellToUpdate(rowId, bookColsAlphabet.rental_dates)}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[newRentalValues[0], newRentalValues[1], newRentalValues[2]]],
            },
        });
    } catch (error) {
        console.error('Error renting book:', error);
        throw new Error('Failed to rent book. Please check your Google Sheets configuration.');
    }
}

import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';
const SHEET_NAME = process.env.SHEET_NAME || 'Livros';

const auth = new GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || './service_account_credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export const bookColsNumber = {
    isbn: 0,
    author: 1,
    title: 2,
    subtitle: 3,
    publication_date: 4,
    description: 5,
    genres: 6,
    publisher: 7,
    quantity: 8,
    rental_names: 9,
    rental_emails: 10,
    rental_dates: 11,
    rental_return_dates: 12,
    rental_status: 13,
    notes: 14,
};

export const bookColsAlphabet = {
    isbn: 'A',
    author: 'B',
    title: 'C',
    subtitle: 'D',
    publication_date: 'E',
    description: 'F',
    genres: 'G',
    publisher: 'H',
    quantity: 'I',
    rental_names: 'J',
    rental_emails: 'K',
    rental_dates: 'L',
    rental_return_dates: 'M',
    status: 'N',
    notes: 'O',
};

export interface Book {
    rowId: number;
    isbn: string;
    author: string;
    title: string;
    subtitle: string;
    publicationDate: string;
    description: string;
    genres: string[];
    publisher: string;
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

    const rentals: Rental[] = [];
    for (let i = 0; i < rentalNames.length; i++) {
        if (rentalNames[i] && rentalNames[i].trim()) {
            rentals.push({
                name: rentalNames[i].trim(),
                email: rentalEmails[i]?.trim() || '',
                date: rentalDates[i]?.trim() || '',
                returnDate: rentalReturnDates[i]?.trim() || '',
                status: rentalStatus[i]?.trim() || '',
            });
        }
    }
    return rentals;
}

function getRentals(b: string[]): Rental[] {
    if (b.length >= bookColsNumber.rental_status + 1) {
        return mapRentals(
            b[bookColsNumber.rental_names],
            b[bookColsNumber.rental_emails],
            b[bookColsNumber.rental_dates],
            b[bookColsNumber.rental_return_dates],
            b[bookColsNumber.rental_status]
        );
    }
    return [];
}

function mapGenres(genres: string): string[] {
    return genres
        .split(',')
        .map((g) => g.trim().toUpperCase())
        .filter(Boolean);
}

export function mapBooks(books: string[][]): Book[] {
    return books
        .filter((_, i) => i !== 0)
        .map((b, index) => {
            const rentals = getRentals(b);
            return {
                filter: `${b[bookColsNumber.isbn]} ${b[bookColsNumber.title]} ${b[bookColsNumber.author]}`.toLowerCase(),
                rowId: index + 2,
                isbn: b[bookColsNumber.isbn] || '',
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
            };
        });
}

export async function getBooks(): Promise<Book[]> {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_NAME,
    });

    const values = response.data.values || [];
    return mapBooks(values);
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
        `${book.isbn || ''}`,
        `${book.author || ''}`,
        `${book.title || ''}`,
        `${book.subtitle || ''}`,
        `${book.publicationDate || ''}`,
        `${book.description || ''}`,
        `${book.genres?.map((g) => g.toUpperCase()).join(',') || ''}`,
        `${book.publisher || ''}`,
        `${book.quantity || 0}`,
    ];
}

export async function rentBook(rowId: number, rental: Rental): Promise<void> {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${getTotalRange(rowId)}`,
    });

    const row = response.data.values?.[0] || [];
    const updatedRange = pushToRentalRange(row, rental);

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${getRentalRangeToUpdate(rowId)}`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [updatedRange],
        },
    });
}

export async function returnBook(rowId: number, rentalToRemove: { name: string; email: string }): Promise<void> {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${getTotalRange(rowId)}`,
    });

    const row = response.data.values?.[0] || [];
    const updatedRange = removeFromRentalRange(row, rentalToRemove);

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${getRentalRangeToUpdate(rowId)}`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [updatedRange],
        },
    });
}

export async function saveBook(book: Partial<Book> & { rowId?: number }): Promise<void> {
    const rowId = book.rowId || (await getNextRowId());

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${getBookRangeToUpdate(rowId)}`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [mapBookToRange(book)],
        },
    });

    if (book.notes !== undefined) {
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!${getCellToUpdate(rowId, bookColsAlphabet.notes)}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[book.notes]],
            },
        });
    }
}

async function getNextRowId(): Promise<number> {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}`,
    });

    const values = response.data.values || [];
    return values.length + 1;
}

export async function deleteBook(rowId: number): Promise<void> {
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${getTotalRange(rowId)}`,
    });
}

export function getBooksWithStatus(books: string[][], status: string) {
    const booksWithStatus: any[] = [];

    for (let i = 0; i < books.length; i++) {
        const allStatus = books[i][bookColsNumber.rental_status];
        if (String(allStatus).match(status)) {
            const rentalNames = parseRentals(books[i][bookColsNumber.rental_names]);
            const rentalEmails = parseRentals(books[i][bookColsNumber.rental_emails]);
            const rentalDates = parseRentals(books[i][bookColsNumber.rental_dates]);
            const rentalReturnDates = parseRentals(books[i][bookColsNumber.rental_return_dates]);
            const rentalStatus = parseRentals(allStatus);
            const rentals = [];

            for (let j = 0; j < rentalStatus.length; j++) {
                if (rentalStatus[j] === status) {
                    rentals.push({
                        order: j,
                        name: rentalNames[j],
                        email: rentalEmails[j],
                        date: rentalDates[j],
                        returnDate: rentalReturnDates[j],
                        status: rentalStatus[j],
                    });
                }
            }
            booksWithStatus.push({
                index: i,
                rowId: i + 2,
                title: books[i][bookColsNumber.title],
                author: [books[i][bookColsNumber.author]],
                rentals,
            });
        }
    }
    return booksWithStatus;
}

export function convertDate(date: string): Date {
    const d = date.split('/');
    return new Date(`${d[2]}/${d[1]}/${d[0]}`);
}

export function returnWeeksDiff(date1: Date, date2: Date): number {
    return (date2.getTime() - date1.getTime()) / (24 * 3600 * 1000 * 7);
}

export async function getLocatarios(): Promise<Locatario[]> {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_NAME,
    });

    const books = response.data.values || [];
    books.splice(0, 1);

    const locatarios: Locatario[] = [];

    const rentedBooks = getBooksWithStatus(books, 'RENTED');
    const extendedBooks = getBooksWithStatus(books, 'EXTENDED');
    const notifiedBooks = getBooksWithStatus(books, 'NOTIFIED');
    const breachingBooks = getBooksWithStatus(books, 'BREACHING');
    const allActiveBooks = [...rentedBooks, ...extendedBooks, ...notifiedBooks, ...breachingBooks];

    for (const book of allActiveBooks) {
        for (const rental of book.rentals) {
            locatarios.push({
                name: rental.name,
                email: rental.email,
                bookTitle: book.title,
                bookAuthor: book.author,
                since: rental.date,
                returnDate: rental.returnDate,
                status: rental.status,
            });
        }
    }

    return locatarios;
}

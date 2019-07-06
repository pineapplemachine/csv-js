export * from "./common";
export * from "./parser";
export * from "./writer";

import {Options, RowsIterable} from "./common";
import {Parser, ParserSourceParameter} from "./parser";
import {Writer, WriterNodeStream} from "./writer";

/**
 * Parse some CSV data without needing to explicitly construct a {@link Parser}.
 * @param source The CSV data input. This can be a string,
 * a NodeJS readable stream, or any iterable or iterator which enumerates
 * data one character at a time.
 * @param options - Optional {@link Options} object to determine parsing behavior.
 * @returns A {@link Parser} object, which behaves as an iterable containing rows.
 */
export function parse(source: ParserSourceParameter, options?: Options): Parser {
    return new Parser(options).parse(source);
}

/**
 * Serialize some CSV data without needing to explicitly construct a {@link Writer}.
 * @param rows - An iterable enumerating rows, where the rows are themselves
 * iterables enumerating columns. Columns are serialized to CSV data strings
 * using the `String()` function.
 * @param options - Optional {@link Options} object to determine serialization
 * behavior.
 * @returns A string containing the fully serialized CSV data.
 */
export function write(rows: RowsIterable, options?: Options): string {
    return new Writer(options).write(rows);
}

/**
 * Stream some serialized CSV data without needing to explicitly construct 
 * a {@link Writer}.
 * @param rows - An iterable enumerating rows, where the rows are themselves
 * iterables enumerating columns. Columns are serialized to CSV data strings
 * using the `String()` function.
 * @param options - Optional {@link Options} object to determine serialization
 * behavior.
 * @returns An object implementing the NodeJS readable stream interface,
 * serializing rows as they are requested instead of all at once.
 */
export function stream(rows: RowsIterable, options?: Options): WriterNodeStream {
    return new Writer(options).stream(rows);
}

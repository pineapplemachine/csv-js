import * as NodeStream from "stream";

import {Options, Configurable, Row, RowsIterator, RowsIterable} from "./common";

/**
 * Provides a NodeJS readable stream interface for lazily serializing rows as
 * CSV data.
 * Instances of this class are returned by the {@link Writer.stream} method.
 */
export class WriterNodeStream extends NodeStream.Readable {
    // Use this Writer instance and its configuration.
    writer: Writer;
    // Serialize these rows.
    rows: RowsIterator;
    
    /**
     * Construct a new WriterNodeStream instance.
     * @param rows - An iterable enumerating rows to be serialized, where the
     * rows are themselves iterables enumerating columns.
     * @param writer - The {@link Writer} instance to use when serializing
     * rows. If the argument isn't provided, then a Writer using the default
     * configuration will be instantiated.
     */
    constructor(rows: RowsIterable, writer?: Writer) {
        super();
        this.rows = (<any> rows)[Symbol.iterator]();
        this.writer = writer || new Writer();
    }
    
    /**
     * Implements a NodeJS readable stream interface.
     * @internal
     */
    _read(): void {
        const next = this.rows && this.rows.next();
        if(!this.writer || !next || next.done) {
            this.push(null);
        }
        else {
            this.push(this.writer.writeRow(next.value));
        }
    }
}

/**
 * Provides a NodeJS stream interface for serializing streamed row arrays as
 * CSV data.
 * Instances of this class are returned by the
 * {@link Writer.streamTransform} method.
 */
export class WriterTransformNodeStream extends NodeStream.Transform {
    // Use this Writer instance and its configuration.
    writer: Writer;
    
    /**
     * Construct a new WriterTransformNodeStream instance.
     * @param writer - The {@link Writer} instance to use when serializing
     * rows. If the argument isn't provided, then a Writer using the default
     * configuration will be instantiated.
     */
    constructor(writer?: Writer, options?: NodeStream.TransformOptions) {
        super(Object.assign({}, options, {
            writableObjectMode: true,
        }));
        this.writer = writer || new Writer();
    }
    
    /**
     * Implements a NodeJS transform stream interface.
     * @internal
     */
    _transform(
        chunk: Row,
        encoding: string,
        callback: NodeStream.TransformCallback,
    ): void {
        this.push(this.writer.writeRow(chunk));
        callback();
    }
}

/**
 * Enumerate serialized CSV data character by character.
 * Instances of this class are returned by
 * the {@link Writer.lazy} method.
 */
export class WriterCharacterIterator {
    // Use this Writer instance and its configuration.
    writer: Writer;
    // Serialize these rows.
    rows: RowsIterator;
    // A buffer containing the current serialized row whose characters should
    // be enumerated.
    buffer: string = "";
    // Current index in the row buffer.
    index: number = 0;
    
    /**
     * Construct a new WriterRowIterator instance.
     * @param rows - An iterable enumerating rows to be serialized, where the
     * rows are themselves iterables enumerating columns.
     * @param writer - The {@link Writer} instance to use when serializing
     * rows. If the argument isn't provided, then a Writer using the default
     * configuration will be instantiated.
     */
    constructor(rows: RowsIterable, writer?: Writer) {
        this.rows = (<any> rows)[Symbol.iterator]();
        this.writer = writer || new Writer();
    }
    
    /**
     * Implement ES6 iterator interface.
     * @returns An ES6 iterator result object having "done" and "value"
     * properties.
     */
    next(): IteratorResult<string> {
        if(!this.buffer || this.index >= this.buffer.length) {
            const next = this.rows && this.rows.next();
            if(!this.writer || !next || next.done) {
                return {done: true, value: ""};
            }
            this.index = 1;
            this.buffer = this.writer.writeRow(next.value);
            // This failure case won't occur with any reasonable kind of
            // writer configuration but, just in case, handle it anyway.
            if(!this.buffer.length) {
                return this.next();
            }
            else {
                return {done: false, value: this.buffer[0]};
            }
        }
        else {
            return {done: false, value: this.buffer[this.index++]};
        }
    }
    
    /**
     * Implement ES6 iterable interface.
     * @returns This instance, which is both an iterable and an iterator.
     */
    [Symbol.iterator](): this {
        return this;
    }
}

/**
 * Enumerate serialized rows. Instances of this class are returned by
 * the {@link Writer.rows} method.
 */
export class WriterRowIterator {
    // Use this Writer instance and its configuration.
    writer: Writer;
    // Serialize these rows.
    rows: RowsIterator;
    
    /**
     * Construct a new WriterRowIterator instance.
     * @param rows - An iterable enumerating rows to be serialized, where the
     * rows are themselves iterables enumerating columns.
     * @param writer - The {@link Writer} instance to use when serializing
     * rows. If the argument isn't provided, then a Writer using the default
     * configuration will be instantiated.
     */
    constructor(rows: RowsIterable, writer?: Writer) {
        this.rows = (<any> rows)[Symbol.iterator]();
        this.writer = writer || new Writer();
    }
    
    /**
     * Implement ES6 iterator interface.
     * @returns An ES6 iterator result object having "done" and "value"
     * properties.
     */
    next(): IteratorResult<string> {
        const next = this.rows && this.rows.next();
        if(!this.writer || !next || next.done) {
            // Value not being undefined is a workaround for
            // https://github.com/microsoft/TypeScript/issues/11375
            return {done: true, value: ""};
        }
        else {
            return {done: false, value: this.writer.writeRow(next.value)};
        }
    }
    
    /**
     * Implement ES6 iterable interface.
     * @returns This instance, which is both an iterable and an iterator.
     */
    [Symbol.iterator](): this {
        return this;
    }
}

/**
 * A Writer instance is used to write CSV data according to a given
 * configuration.
 */
export class Writer extends Configurable {
    /**
     * Construct a new Writer instance using the given configuration.
     * @param options - Optional {@link Options} object to determine
     * serialization behavior for this Writer instance.
     */
    constructor(options?: Options) {
        super(options);
    }
    
    /**
     * Eagerly write the input rows as one aggregated CSV data string.
     * @param rows - An iterable enumerating rows, where the rows are themselves
     * iterables enumerating columns. Columns are serialized to CSV data strings
     * using the `String()` function.
     * @returns A string containing the fully serialized CSV data.
     */
    write(rows: RowsIterable): string {
        const rowIterator = (<any> rows)[Symbol.iterator]();
        let data: string = "";
        while(true) {
            const next = rowIterator.next();
            if(next.done) {
                break;
            }
            else {
                data += this.writeRow(next.value);
            }
        }
        return data;
    }
    
    /**
     * Construct and return an object implementing a NodeJS readable stream
     * interface for lazily serializing some input rows.
     * @param rows - An iterable enumerating rows, where the rows are themselves
     * iterables enumerating columns. Columns are serialized to CSV data strings
     * using the `String()` function.
     * @returns An object implementing the NodeJS readable stream interface,
     * serializing rows as they are requested instead of all at once.
     */
    stream(rows: RowsIterable): WriterNodeStream {
        return new WriterNodeStream(rows, this);
    }
    
    /**
     * Construct and return a NodeJS stream which transforms rows, represented
     * as iterables of strings, into a serialized CSV.
     * @returns An object implementing the NodeJS transform stream interface,
     * able to serialized piped rows in a stream instead of all at once.
     */
    streamTransform(): WriterTransformNodeStream {
        return new WriterTransformNodeStream(this);
    }
    
    /**
     * Construct and return an object implementing an ES6 iterator interface
     * for enumerating lazily serialized rows one-by-one.
     * @param rows - An iterable enumerating rows, where the rows are themselves
     * iterables enumerating columns. Columns are serialized to CSV data strings
     * using the `String()` function.
     * @returns An iterator whose elements are the input rows, serialized as
     * CSV data strings. Note that every output row will end with a row
     * terminator (i.e. a newline), including the final row.
     */
    rows(rows: RowsIterable): WriterRowIterator {
        return new WriterRowIterator(rows, this);
    }
    
    /**
     * Construct and return an object implementing an ES6 iterator interface
     * for enumerating lazily serialized CSV data character-by-character.
     * @param rows - An iterable enumerating rows, where the rows are themselves
     * iterables enumerating columns. Columns are serialized to CSV data strings
     * using the `String()` function.
     * @returns An iterator enumerating the characters of the lazily serialized
     * output.
     */
    iterate(rows: RowsIterable): WriterRowIterator {
        return new WriterCharacterIterator(rows, this);
    }
    
    /**
     * Serialize a single row of CSV data using this Writer's configuration.
     * @param row - An iterable enumerating columns in a row.
     * Columns are serialized to CSV data strings using the `String()` function.
     * @returns A CSV data string representing the serialized row.
     */
    writeRow(row: Row): string {
        if(!row) {
            return this.newline;
        }
        let data = "";
        let initial = true;
        for(const column of row) {
            if(!initial) {
                data += this.separator;
            }
            data += this.writeColumn(column);
            initial = false;
        }
        return data + this.newline;
    }
    
    /**
     * Serialize a single column of CSV data using this Writer's configuration.
     * Columns containing special characters such as row or column separators
     * will be quote-escaped.
     * Depending on the Writer configuration, all columns may be escaped
     * regardless of their content.
     * @param column - The column value which must be serialized.
     * Columns are serialized to CSV data strings using the `String()` function.
     * @returns A CSV data string representing the serialized column.
     */
    writeColumn(value: any): string {
        const unescaped = String(value);
        let escaped: string = "";
        let needsQuotes: boolean = this.quoteAll || false;
        for(let i = 0; i < unescaped.length; i++) {
            if(unescaped[i] === this.quote) {
                escaped += this.quote + this.quote;
                needsQuotes = true;
            }
            else {
                escaped += unescaped[i];
                if(
                    this.newline.indexOf(unescaped[i]) >= 0 ||
                    unescaped[i] === this.separator
                ) {
                    needsQuotes = true;
                }
            }
        }
        return (needsQuotes ?
            this.quote + escaped + this.quote : unescaped
        );
    }
}

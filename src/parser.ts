import * as NodeStream from "stream";

import {Options, Configurable} from "./common";

/**
 * Any iterator which enumerates characters one at a time from
 * some serialized CSV data source can be recognized and handled by a
 * {@link Parser} object.
 */
export type ParserSource = Iterator<string>;

/**
 * Represents the source parameter types accepted by the {@link Parser}
 * constructor and its {@link Parser.parse} method.
 * Specifically this means either a string, a NodeJS readable stream, or an
 * iterable or iterable for enumerating the characters of a CSV data source
 * one-by-one.
 */
export type ParserSourceParameter = (
    string | Iterator<string> | Iterable<string> | NodeStream.Readable
);

/**
 * Internal helper to determine if a value is an iterable object.
 * The function checks only for objects, and won't return true for strings.
 * @param value - The value to check.
 * @returns True when the input value resembled an ES6 iterable object and
 * false otherwise.
 * @internal
*/
function isIterable<T = any>(value: any): value is Iterable<T> {
    return (value &&
        typeof(value) === "object" &&
        typeof((<any> value)[Symbol.iterator]) === "function"
    );
}

/**
 * Internal helper to determine if a value is an iterator object.
 * @param value - The value to check.
 * @returns True when the input value resembled an ES6 iterator object and
 * false otherwise.
 * @internal
*/
function isIterator<T = any>(value: any): value is Iterator<T> {
    return (value &&
        typeof(value) === "object" &&
        typeof(value.next) === "function"
    );
}

/**
 * Internal helper to determine if an input value was a NodeJS readable stream.
 * @param value - The value to check.
 * @returns True when the input value resembled a NodeJS readable stream and
 * false otherwise.
 * @internal
*/
function isNodeStream(value: any): value is NodeStream.Readable {
    return (value &&
        typeof(value) === "object" &&
        typeof(value.read) === "function"
    );
}

/**
 * This class implements a {@link ParserSource} interface for NodeJS readable streams.
 */
export class NodeStreamSource {
    // Read data from this stream.
    readable?: NodeStream.Readable;
    // Current UCS-2 character index in the buffer string.
    index: number = 0;
    // Currently buffered data from the stream.
    buffer: string = "";
    // Set when there is no more data to read from the buffer.
    eof: boolean = false;
    
    /**
     * Construct a NodeStreamSource using the given NodeJS readable stream
     * object. 
     * Note that the encoding of the stream will not be changed by this object -
     * in most cases, you will want to set the stream's encoding to "utf8"
     * either when the stream was constructed or using a "setEncoding" method.
     * @param readable - The NodeJS readable stream object which should be
     * used as a basis for this iterator.
     */
    constructor(readable: NodeStream.Readable) {
        this.readable = readable;
    }
    
    /**
     * Implement ES6 iterator interface.
     * @returns An ES6 iterator result object having "done" and "value"
     * properties.
     */
    next(): IteratorResult<string> {
        // If a buffer is available and if it hasn't yet been completely
        // consumed, then consume and return the next character in the buffer.
        if(this.buffer && this.index < this.buffer.length) {
            return {done: false, value: this.buffer[this.index++]};
        }
        // If there's no buffer and there's no stream available, then return
        // the EOF signal.
        if(!this.readable) {
            return {done: true, value: ""};
        }
        // Lock the stream if it wasn't locked already.
        this.readable.pause();
        // Get the next chunk from the stream.
        const data = this.readable.read();
        // No more data? Signal EOF by returning undefined.
        if(!data || !data.length) {
            this.eof = true;
            this.readable.resume(); // Unlock the stream
            return {done: true, value: ""};
        // Got a string - user code set stream encoding, like a boss.
        }else if(typeof(data) === "string") {
            this.buffer = data;
        // Got a buffer - do our best to not break, even though the user code
        // didn't set a stream encoding as it really should have done.
        }else {
            this.buffer = data.toString("utf8");
        }
        // Consume and return the first character in the chunk buffer newly
        // read from the backing stream.
        this.eof = false;
        this.index = 1;
        return {done: !this.buffer.length, value: this.buffer[0] || ""};
    }
}

/**
 * A Parser instance is used to parse CSV data according to a given
 * configuration.
 */
export class Parser extends Configurable {
    // Read data from this source.
    source?: ParserSource;
    
    /**
     * Construct a new Parser instance using the given configuration and
     * serialized CSV data input.
     *
     * Note that a call to the {@link Parser.parse} method will be required
     * to assign a data source to the Parser instance before it can provide
     * useful parsing behavior.
     *
     * @param options - Optional {@link Options} object to determine
     * parsing behavior for this Parser instance.
     */
    constructor(options?: Options) {
        super(options);
    }
    
    /**
     * Assign an input serialized CSV data source to this Parser.
     * @param source The CSV data input. This can be a string,
     * a NodeJS readable stream, or any iterable or iterator which enumerates
     * serialized CSV data one character at a time.
     * @returns This instance, for easy chaining.
     */
    parse(source: ParserSourceParameter): this {
        if(isIterator(source)) {
            this.source = source;
        }else if(typeof(source) === "string" || isIterable(source)) {
            this.source = (<any> source)[Symbol.iterator]();
        }else if(isNodeStream(source)) {
            this.source = new NodeStreamSource(<NodeStream.Readable> source);
        }
        return this;
    }
    
    /**
     * Eagerly consume the entire source data in order to produce an array of
     * all the rows represented within the serialized CSV data.
     * Note that this `myParser.rows()` is behaviorally identical to
     * `Array.from(myParser)` and is provided for the sake of convenience.
     * @returns An array of rows, where each row is an array of columns, and
     * each column is simply represented by a string value.
     */
    rows(): string[][] {
        const rows: string[][] = [];
        while(true) {
            const row = this.nextRow();
            if(row) {
                rows.push(row);
            }else {
                break;
            }
        }
        return rows;
    }
    
    /**
     * Implement ES6 iterator interface.
     * @returns An ES6 iterator result object having "done" and "value"
     * properties.
     */
    next(): IteratorResult<string[]> {
        // Value not being undefined when "done" is true is a workaround for
        // https://github.com/microsoft/TypeScript/issues/11375
        const row = this.nextRow();
        return {done: !row, value: row || []};
    }
    
    /**
     * Implement ES6 iterable interface.
     * @returns This instance, which is both an iterable and an iterator.
     */
    [Symbol.iterator](): this {
        return this;
    }
    
    /**
     * Parse one row from the data source and advance to the next row.
     * @returns An array of column strings, or undefined if there were no
     * rows left to parse.
     */
    nextRow(): string[] | undefined {
        if(!this.source) {
            return undefined;
        }
        let row: string[] = [];
        let column: string = "";
        let quoted: boolean = false;
        let last: string = "";
        let consumed: number = 0;
        let terminator: number = 0;
        while(true) {
            // If ch is undefined, then there is no more data in the source.
            const next = this.source.next();
            const ch = String(next.value);
            if(next.done || !next.value) {
                if(consumed === 0) {
                    return undefined;
                }else {
                    break;
                }
            }
            // Consume this next character.
            consumed++;
            if(quoted && ch === this.quote) {
                quoted = false;
            }else if(quoted) {
                column += ch;
            }else if(last === this.quote && ch === this.quote) {
                quoted = true;
                column += this.quote;
            }else if(ch === this.quote) {
                quoted = true;
            }else if(ch === this.separator) {
                row.push(column);
                column = "";
            }else if(ch === "\n") {
                if(last === "\r") {
                    column = column.slice(0, column.length - 1);
                    terminator = 2;
                }else {
                    terminator = 1;
                }
                break;
            }else {
                column += ch;
            }
            last = ch;
        }
        // Only push a column into the row if there was at least one character
        // not part of the terminating newline.
        if(consumed > terminator) {
            row.push(column);
        }
        // All done.
        return row;
    }
}

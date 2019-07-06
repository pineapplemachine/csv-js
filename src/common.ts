/**
 * This is an interface describing the configuration options objects which
 * are recognized when configuring {@link Writer} and {@link Parser} class
 * instances.
 * Note that missing options fields are filled using the default values in
 * the global {@link DefaultOptions} object.
 */
export interface Options {
    /**
     * Single UCS-2 character representing the column separator.
     */
    separator?: string;
    /**
     * A string representing the row terminator, i.e. the newline string.
     * Note that while {@link Writer} instances can write any row terminator
     * whatsoever, the parser can handle only Unix-style "\n" and Windows-style
     * "\r\n" row terminators. (And it can always handle both, even when
     * both are alternately used in the same input CSV data.)
     */
    newline?: string;
    /**
     * Single UCS-2 character to use when quote-escaping fields.
     */
    quote?: string;
    /**
     * When set to true, all columns will be quoted when writing CSV output
     * regardless of whether they contain special characters.
     */
    quoteAll?: boolean;
}

/**
 * Default {@link Writer} and {@link Parser} configuration object.
 * When a configuration options object isn't provided, or when some fields
 * are omitted from an options object, these values are used as defaults.
 */
export const DefaultOptions: Options = {
    /**
     * Default to comma ',' column separators.
     */
    separator: ",",
    /**
     * Default to CRLF row terminators.
     */
    newline: "\r\n",
    /**
     * Default to the double quote character '"' for column quote-escaping.
     */
    quote: "\"",
    /**
     * Default to not quote-escaping columns that don't contain special
     * characters.
     */
    quoteAll: false,
};

/**
 * The library recognizes any iterable object as a row value.
 */
export type Row = Iterable<any>;

/*
 * An Iterable which itself enumerates a list of Iterables.
 * This type is used where a list of rows is expected.
 */
export type RowsIterable = Iterable<Row>;

/**
 * Helpful reference type to use where some iterable containing rows -
 * each row itself being an iterable containing columns - must be represented.
 */
export type RowsIterator = Iterator<Row>;

/**
 * Base class for CSV {@link Parser} and {@link Writer} types, which holds
 * configuration data that affects parsing and serialization behavior.
 */
export class Configurable {
    /** 
     * Column separator character.
     */
    separator!: string;
    /** 
     * Row separator string.
     */
    newline!: string;
    /** 
     * Quote/escape character.
     */
    quote!: string;
    /** 
     * Whether to quote/escape all columns when serializing.
     */
    quoteAll!: boolean;
    
    /**
     * Construct a new Configurable instance using the given options.
     * @param options - Optional {@link Options} object to determine
     * parsing or serialization behavior for this Configurable instance.
     */
    constructor(options?: Options) {
        this.configure(options);
    }
    
    /**
     * Apply the given options to this Configurable object.
     * @param options - Optional {@link Options} object to determine
     * parsing or serialization behavior.
     * @returns This instance, for easy chaining.
     */
    configure(options?: Options): this {
        this.separator = (options && "separator" in options ?
            options.separator : DefaultOptions.separator
        ) || "";
        this.newline = (options && "newline" in options ?
            options.newline : DefaultOptions.newline
        ) || "";
        this.quote = (options && "quote" in options ?
            options.quote : DefaultOptions.quote
        ) || "";
        this.quoteAll = (options && "quoteAll" in options ?
            options.quoteAll : DefaultOptions.quoteAll
        ) || false;
        return this;
    }
}

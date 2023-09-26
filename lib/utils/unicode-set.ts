/**
 * A single character set of ClassSetReservedDoublePunctuator.
 *
 * `&& !! ## $$ %% ** ++ ,, .. :: ;; << == >> ?? @@ ^^ `` ~~ --` are ClassSetReservedDoublePunctuator
 */
export const RESERVED_DOUBLE_PUNCTUATOR_CHARS: ReadonlySet<string> = new Set(
    "&!#$%*+,.:;<=>?@^`~-",
)

/**
 * Same as {@link RESERVED_DOUBLE_PUNCTUATOR_CHARS} but as code points.
 */
export const RESERVED_DOUBLE_PUNCTUATOR_CP: ReadonlySet<number> = new Set(
    [...RESERVED_DOUBLE_PUNCTUATOR_CHARS].map((c) => c.codePointAt(0)!),
)

export const RESERVED_DOUBLE_PUNCTUATOR_PATTERN =
    /&&|!!|##|\$\$|%%|\*\*|\+\+|,,|\.\.|::|;;|<<|==|>>|\?\?|@@|\^\^|``|~~|--/u

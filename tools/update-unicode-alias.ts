import fs from "node:fs"
import path from "node:path"

type Alias = {
    short: string
    long: string
    other: string[]
}
type UnicodePropertyValueAlias = {
    propertyAlias: string
} & Alias
type UnicodePropertyAlias = {
    category: string
} & Alias

const filePath = path.resolve(__dirname, "../lib/utils/unicode-alias.ts")
const logger = console

void main()

async function main() {
    const propertyAliases: UnicodePropertyAlias[] = []
    for await (const item of getUnicodePropertyAliases()) {
        propertyAliases.push(item)
    }
    const propertyValueAliases: UnicodePropertyValueAlias[] = []
    for await (const item of getUnicodePropertyValueAliases()) {
        propertyValueAliases.push(item)
    }
    const content = fs
        .readFileSync(filePath, "utf-8")
        .replace(
            /\/\*\s*PROPERTY_ALIASES_START\s*\*\/[\s\S]*\/\*\s*PROPERTY_ALIASES_END\s*\*\//u,
            `/* PROPERTY_ALIASES_START */
// https://unicode.org/Public/UCD/latest/ucd/PropertyAliases.txt
${generateAliasMap(
    "UNICODE_BINARY_PROPERTY_ALIAS",
    propertyAliases.filter((u) => u.category === "Binary Properties"),
)}
/* PROPERTY_ALIASES_END */`,
        )
        .replace(
            /\/\*\s*PROPERTY_VALUE_ALIASES_START\s*\*\/[\s\S]*\/\*\s*PROPERTY_VALUE_ALIASES_END\s*\*\//u,
            `/* PROPERTY_VALUE_ALIASES_START */
// https://unicode.org/Public/UCD/latest/ucd/PropertyValueAliases.txt
${generateAliasMap(
    "UNICODE_GENERAL_CATEGORY_ALIAS",
    propertyValueAliases.filter((u) => u.propertyAlias === "gc"),
)}

// https://unicode.org/Public/UCD/latest/ucd/PropertyValueAliases.txt
${generateAliasMap(
    "UNICODE_SCRIPT_ALIAS",
    propertyValueAliases.filter((u) => u.propertyAlias === "sc"),
)}
/* PROPERTY_VALUE_ALIASES_END */`,
        )

    // Update file.
    fs.writeFileSync(filePath, content)
}

function generateAliasMap(name: string, aliases: Alias[]): string {
    let content = `export const ${name} = new AliasMap({
    shortToLong: {
`
    const shortToLong = new Map<string, string>()
    const otherToLong = new Map<string, string>()
    for (const item of aliases) {
        shortToLong.set(item.short, item.long)
        for (const o of item.other) {
            otherToLong.set(o, item.long)
        }
    }
    content += mapToProperties(shortToLong)
    content += `
    },
    otherToLong: {
`
    content += mapToProperties(otherToLong)
    content += `
    },
})`

    return content

    function mapToProperties(map: Map<string, string>) {
        return (
            [...map]
                .filter(([s, l]) => s !== l)
                // .sort(([a], [b]) => (a > b ? 1 : -1))
                .map(([s, l]) => `        ${s}: "${l}",`)
                .join("\n")
        )
    }
}

async function* getUnicodePropertyAliases(): AsyncIterable<UnicodePropertyAlias> {
    const DB_URL =
        "https://unicode.org/Public/UCD/latest/ucd/PropertyAliases.txt"
    logger.log("Fetching data... (%s)", DB_URL)

    const dbContent = await fetch(DB_URL).then((res) => res.text())
    const dbLines = dbContent.split("\n")
    let category = ""
    for (let index = 0; index < dbLines.length; index++) {
        const line = dbLines[index]
        if (!line) {
            continue
        }
        if (line[0] === "#") {
            if (
                /^#\s*=+$/u.test(dbLines[index - 1]) &&
                /^#\s*=+$/u.test(dbLines[index + 1])
            ) {
                category = line.slice(1).trim()
            }
            continue
        }
        const [short, long, ...other] = line
            .split("#")[0] // strip comments
            .split(";") // split by semicolon
            .map((x) => x.trim()) // trim

        yield {
            category,
            short,
            long,
            other,
        }
    }
}

async function* getUnicodePropertyValueAliases(): AsyncIterable<UnicodePropertyValueAlias> {
    const DB_URL =
        "https://unicode.org/Public/UCD/latest/ucd/PropertyValueAliases.txt"
    logger.log("Fetching data... (%s)", DB_URL)
    const dbContent = await fetch(DB_URL).then((res) => res.text())
    for (const line of dbContent.split("\n")) {
        if (!line || line[0] === "#") {
            continue
        }
        const [propertyAlias, short, long, ...other] = line
            .split("#")[0] // strip comments
            .split(";") // split by semicolon
            .map((x) => x.trim()) // trim

        yield {
            propertyAlias,
            short,
            long,
            other,
        }
    }
}

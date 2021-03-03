import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { isTypeClass } from "."
import { getFunctionPrototypes } from "./function"

class TypeCollection {
    private readonly names: Set<
        NamedType | OtherTypeName | TypeClass
    > = new Set()

    private readonly types: TypeInfo[] = []

    public readonly iterator: IterableIterator<TypeInfo>

    public constructor(generator?: () => IterableIterator<TypeInfo>) {
        this.iterator = generator?.() ?? [][Symbol.iterator]()
    }

    private *iter(): IterableIterator<TypeInfo> {
        for (const t of this.iterator) {
            this.types.push(t)
            if (typeof t === "function" || typeof t === "symbol") {
                this.names.add("Function")
                yield t
            } else {
                this.names.add(t)
                yield t
            }
        }
    }

    private *itrAll(): IterableIterator<TypeInfo> {
        yield* this.types
        yield* this.iter()
    }

    public has(type: NamedType | OtherTypeName): boolean {
        if (this.names.has(type)) {
            return true
        }
        for (const t of this.iter()) {
            if (typeof t === "string") {
                if (t === type) return true
            } else if (typeof t === "function" || typeof t === "symbol") {
                if (type === "Function") return true
            } else {
                if (t.has(type)) return true
            }
        }
        return false
    }

    // public list(): TypeInfo[] {
    //     return [...this.itrAll()]
    // }

    public *all(): IterableIterator<TypeInfo> {
        const set = new Set()
        for (const t of this.itrAll()) {
            if (!set.has(t)) {
                set.add(t)
                yield t
            }
        }
    }

    public *strings(): IterableIterator<string> {
        const set = new Set()
        for (const t of this.all()) {
            if (typeof t === "string") {
                const str = t
                if (!set.has(str)) {
                    set.add(t)
                    yield str
                }
            } else if (typeof t === "function" || typeof t === "symbol") {
                const str = "Function"
                if (!set.has(str)) {
                    set.add(t)
                    yield str
                }
            } else {
                for (const str of t.typeNames()) {
                    if (!set.has(str)) {
                        set.add(t)
                        yield str
                    }
                }
            }
        }
    }
}

export class TypeUnionOrIntersection implements ITypeClass {
    public type = "TypeUnionOrIntersection" as const

    private readonly collection: TypeCollection

    public constructor(generator?: () => IterableIterator<TypeInfo>) {
        this.collection = new TypeCollection(generator)
    }

    public has(type: NamedType | OtherTypeName): boolean {
        return this.collection.has(type)
    }

    public paramType(): null {
        return null
    }

    public propertyType(name: string): TypeInfo | null {
        for (const type of this.collection.all()) {
            const propType = isTypeClass(type)
                ? type.propertyType(name)
                : typeof type === "function"
                ? getFunctionPrototypes()[name as never]
                : null
            if (propType) {
                return propType
            }
        }
        return null
    }

    public iterateType(): TypeInfo | null {
        for (const type of this.collection.all()) {
            if (isTypeClass(type)) {
                const itrType = type.iterateType()
                if (itrType) {
                    return itrType
                }
            }
        }
        return null
    }

    public typeNames(): string[] {
        // eslint-disable-next-line @typescript-eslint/require-array-sort-compare -- ignore
        return [...this.collection.strings()].sort()
    }
}

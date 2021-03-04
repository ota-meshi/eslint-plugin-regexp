import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { isTypeClass } from "."
import { isEquals, TypeCollection } from "./common"

export class TypeUnionOrIntersection implements ITypeClass {
    public type = "TypeUnionOrIntersection" as const

    private readonly collection: TypeCollection

    public constructor(generator?: () => IterableIterator<TypeInfo | null>) {
        this.collection = new TypeCollection(generator)
    }

    public has(type: NamedType | OtherTypeName): boolean {
        return this.collection.has(type)
    }

    public paramType(): null {
        return null
    }

    public propertyType(name: string): TypeInfo | null {
        const baseCollection = this.collection
        const collection = new TypeCollection(function* () {
            for (const type of baseCollection.all()) {
                const propType = isTypeClass(type)
                    ? type.propertyType(name)
                    : null
                if (propType) {
                    yield propType
                }
            }
        })
        if (collection.isOneType()) {
            for (const t of collection.all()) {
                return t
            }
            return null
        }
        return new TypeUnionOrIntersection(() => collection.all())
    }

    public iterateType(): TypeInfo | null {
        const baseCollection = this.collection
        const collection = new TypeCollection(function* () {
            for (const type of baseCollection.all()) {
                if (isTypeClass(type)) {
                    const itrType = type.iterateType()
                    if (itrType) {
                        yield itrType
                    }
                }
            }
        })
        if (collection.isOneType()) {
            for (const t of collection.all()) {
                return t
            }
            return null
        }
        return new TypeUnionOrIntersection(() => collection.all())
    }

    public returnType(
        thisType: (() => TypeInfo | null) | null,
        argTypes: ((() => TypeInfo | null) | null)[],
    ): TypeInfo | null {
        const baseCollection = this.collection
        const collection = new TypeCollection(function* () {
            for (const type of baseCollection.all()) {
                if (isTypeClass(type)) {
                    const itrType = type.returnType(thisType, argTypes)
                    if (itrType) {
                        yield itrType
                    }
                }
            }
        })
        if (collection.isOneType()) {
            for (const t of collection.all()) {
                return t
            }
            return null
        }
        return new TypeUnionOrIntersection(() => collection.all())
    }

    public typeNames(): string[] {
        // eslint-disable-next-line @typescript-eslint/require-array-sort-compare -- ignore
        return [...this.collection.strings()].sort()
    }

    public equals(o: TypeClass): boolean {
        if (o.type !== "TypeUnionOrIntersection") {
            return false
        }
        const itr1 = this.collection.all()
        const itr2 = o.collection.all()
        let e1 = itr1.next()
        let e2 = itr2.next()
        while (!e1.done && !e2.done) {
            if (!isEquals(e1.value, e2.value)) {
                return false
            }
            e1 = itr1.next()
            e2 = itr2.next()
        }
        return e1.done === e2.done
    }
}

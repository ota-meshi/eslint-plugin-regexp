import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { isTypeClass } from "."
import { isEquals, TypeCollection } from "./common"
import { getFunctionPrototypes } from "./function"

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

    public equals(o: TypeClass): boolean {
        if (!(o instanceof TypeUnionOrIntersection)) {
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

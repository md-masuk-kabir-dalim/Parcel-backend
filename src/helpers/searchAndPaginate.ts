import { Prisma } from "@prisma/client";

type SearchAndPaginateParams<T, WhereInput, Select, Include, OrderBy> = {
  model: {
    findMany: (args: {
      where?: WhereInput;
      skip?: number;
      take?: number;
      select?: Select;
      include?: Include;
      orderBy?: OrderBy | OrderBy[];
    }) => Promise<T[]>;
    count: (args: { where?: WhereInput }) => Promise<number>;
  };
  searchableFields: (keyof T)[];
  page?: number;
  limit?: number;
  searchQuery?: string;
  additionalFilter?: WhereInput;
  selectFields?: Select;
  includeFields?: Include;
  orderBy?: OrderBy | OrderBy[];
};

const searchAndPaginate = async <
  T,
  WhereInput extends Record<string, any>,
  Select,
  Include,
  OrderBy
>({
  model,
  searchableFields,
  page = 1,
  limit = 10,
  searchQuery = "",
  additionalFilter = {} as WhereInput,
  selectFields,
  includeFields,
  orderBy,
}: SearchAndPaginateParams<T, WhereInput, Select, Include, OrderBy>) => {
  const skip = (page - 1) * limit;

  const searchFilter = searchQuery
    ? {
        OR: searchableFields.map((field) => ({
          [field]: {
            contains: searchQuery,
            mode: Prisma.QueryMode.insensitive,
          },
        })),
        ...additionalFilter,
      }
    : additionalFilter;

  if (selectFields && includeFields) {
    throw new Error(
      "Cannot use both 'select' and 'include' in the same query."
    );
  }

  const data = await model.findMany({
    where: searchFilter,
    skip,
    take: limit,
    orderBy: orderBy ?? ({ createdAt: "desc" } as unknown as OrderBy),
    ...(selectFields ? { select: selectFields } : {}),
    ...(includeFields ? { include: includeFields } : {}),
  });

  const total = await model.count({ where: searchFilter });

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export default searchAndPaginate;

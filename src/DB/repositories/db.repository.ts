
import mongoose, {
    Model,
    ProjectionType,
    QueryOptions,
    UpdateQuery,
    PopulateOptions,
    SortOrder
} from "mongoose";

interface CreateOptions<T> {
    model: Model<T>;
    data: Partial<T>;
    options?: QueryOptions<T>;
}

interface FindByIdOptions<T> {
    model: Model<T>;
    id: string;
    projection?: ProjectionType<T>;
    options?: QueryOptions<T>;
}

interface FindOptions<T> {
    model: Model<T>;
    filter: mongoose.QueryFilter<T>;
    options?: {
        limit?: number;
        skip?: number;
        sort?: Record<string, SortOrder>;
        populate?: PopulateOptions | (string | PopulateOptions)[];
        select?: string;
    };
}

interface FindOneOptions<T> {
    model: Model<T>;
    filter: mongoose.QueryFilter<T>;
    projection?: ProjectionType<T>;
    options?: QueryOptions<T>;
}

interface FindOneAndUpdateOptions<T> {
    model: Model<T>;
    filter: mongoose.QueryFilter<T>;
    update: UpdateQuery<T>;
    options?: QueryOptions<T>;
}

interface FindByIdAndUpdateOptions<T> {
    model: Model<T>;
    id: string;
    update: UpdateQuery<T>;
    options?: QueryOptions<T>;
}

interface UpdateOneOptions<T> {
    model: Model<T>;
    filter: mongoose.QueryFilter<T>;
    update: UpdateQuery<T>;
}

export class DBRepository {

    async create<T>({
        model,
        data,
        options = {}
    }: CreateOptions<T>) {
        return await model.create(data as any);
    }

    async findById<T>({
        model,
        id,
        projection,
        options = {}
    }: FindByIdOptions<T>) {
        return await model.findById(id, projection, options);
    }

    async find<T>({
        model,
        filter,
        options = {}
    }: FindOptions<T>) {
        const data = model.find(filter);

        if (options.limit) data.limit(options.limit);
        if (options.skip) data.skip(options.skip);
        if (options.sort) data.sort(options.sort);
        if (options.populate) data.populate(options.populate);
        if (options.select) data.select(options.select);

        return data.exec();
    }

    async findOne<T>({
        model,
        filter,
        projection = {},
        options = {}
    }: FindOneOptions<T>) {
        return await model.findOne(filter, projection, options);
    }

    async findOneAndUpdate<T>({
        model,
        filter,
        update,
        options = {}
    }: FindOneAndUpdateOptions<T>) {
        return await model.findOneAndUpdate(filter, update, {
            new: true,
            runValidators: true,
            ...options
        });
    }

    async findByIdAndUpdate<T>({
        model,
        id,
        update,
        options = {}
    }: FindByIdAndUpdateOptions<T>) {
        return await model.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
            ...options
        });
    }

    async updateOne<T>({
        model,
        filter,
        update
    }: UpdateOneOptions<T>) {
        return await model.updateOne(filter, update);
    }
}

export default new DBRepository();

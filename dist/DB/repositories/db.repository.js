class DBRepository {
    async create({ model, data, options = {} }) {
        return await model.create(data);
    }
    async findById({ model, id, projection, options = {} }) {
        return await model.findById(id, projection, options);
    }
    async find({ model, filter, options = {} }) {
        const data = model.find(filter);
        if (options.limit)
            data.limit(options.limit);
        if (options.skip)
            data.skip(options.skip);
        if (options.sort)
            data.sort(options.sort);
        if (options.populate)
            data.populate(options.populate);
        if (options.select)
            data.select(options.select);
        return data.exec();
    }
    async findOne({ model, filter, projection = {}, options = {} }) {
        return await model.findOne(filter, projection, options);
    }
    async findOneAndUpdate({ model, filter, update, options = {} }) {
        return await model.findOneAndUpdate(filter, update, {
            new: true,
            runValidators: true,
            ...options
        });
    }
    async findByIdAndUpdate({ model, id, update, options = {} }) {
        return await model.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
            ...options
        });
    }
    async updateOne({ model, filter, update }) {
        return await model.updateOne(filter, update);
    }
}
export default new DBRepository();

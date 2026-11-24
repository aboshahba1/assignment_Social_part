export const create = async ({ model, data, options = {} }) => {
    return await model.create([data], options);
};
export const findById = async ({ model, id, options }) => {
    return await model.findById(id, null, options);
};
export const find = async ({ model, filter, options = {} }) => {
    const data = model.findOne(filter);
    if (options.limit)
        data.limit(options.limit);
    if (options.skip)
        data.skip(options.skip);
    if (options.sort)
        data.sort(options.sort);
    if (options.populate)
        data.populate(options.populate);
    return data.exec();
};
export const findOne = async ({ model, filter, projection = {}, options = {} }) => {
    return await model.findOne(filter, projection, options);
};
export const findOneAndUpdate = async ({ model, filter, update, options = {} }) => {
    return await model.findOneAndUpdate(filter, update, {
        new: true,
        runValidators: true,
        ...options
    });
};
export const findByIdAndUpdate = async ({ model, filter }) => {
    return await model.findOneAndUpdate(filter);
};

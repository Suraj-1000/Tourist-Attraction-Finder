class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async findAll(filter = {}, options = {}) {
        return this.model.find(filter, null, options);
    }

    async findById(id) {
        return this.model.findById(id);
    }

    async findOne(filter) {
        return this.model.findOne(filter);
    }

    async create(data) {
        return this.model.create(data);
    }

    async update(id, data) {
        return this.model.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return this.model.findByIdAndDelete(id);
    }

    async count(filter = {}) {
        return this.model.countDocuments(filter);
    }
}

export default BaseRepository;

import { In, IsNull, Not, Repository } from 'typeorm';

export class BaseSoftDeleteService<T extends { id: number }> {
    constructor(protected readonly repo: Repository<T>) { }

    async softDeleteMany(ids: number[]) {
        this.repo.softDelete(ids);
    }

    async restoreMany(ids: number[]) {
        this.repo.restore(ids);

    }

    async findDeleted() {
        return this.repo.find({
            withDeleted: true,
            where: {
                deletedAt: Not(IsNull()),
            } as any,
        });
    }

    async findActive() {
        return this.repo.find({
            withDeleted: false,
        });
    }

    async softDeleteOne(id: number) {
        return this.repo.softDelete(id);
    }

    async restoreOne(id: number) {
        return this.repo.restore(id);
    }
}

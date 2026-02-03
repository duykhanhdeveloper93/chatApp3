import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Menu } from "../database/entities/menu.entity";
import { Role } from "../database/entities/role.entity";

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private readonly menusRepository: Repository<Menu>,
  ) {}

  async findOrCreate(data: {
    code: string;
    name: string;
    path: string;
    roles: Role[];
  }): Promise<Menu> {
    let menu = await this.menusRepository.findOne({
      where: { code: data.code },
      relations: ["roles"],
    });

    if (menu) {
      menu.roles = data.roles;
      return this.menusRepository.save(menu);
    }

    menu = this.menusRepository.create(data);
    return this.menusRepository.save(menu);
  }

  async findByRole(roleCodes: string[]): Promise<Menu[]> {
    return this.menusRepository
      .createQueryBuilder("menu")
      .leftJoinAndSelect("menu.roles", "role")
      .where("role.code IN (:...roleCodes)", { roleCodes })
      .getMany();
  }

  async findAll() {
    return this.menusRepository.find({
      relations: ["roles"],
      order: { createdAt: "ASC" },
    });
  }
}

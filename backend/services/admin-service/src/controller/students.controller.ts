import { Request, Response, NextFunction } from 'express';
import { Controller } from '@aaft/common-lib';
import { StudentsService } from '../service/students.service';
import type {
  ListStudentsQueryDto,
  CreateStudentDto,
  UpdateStudentDto,
} from '../validator/students.dto';

export class StudentsController extends Controller {
  constructor(private readonly students: StudentsService) {
    super();
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query as unknown as ListStudentsQueryDto;
      const result = await this.students.listStudents(q);
      this.paginated(res, result);
    } catch (e) {
      next(e);
    }
  };

  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.students.getStudent(req.params.id);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.students.createStudent(req.body as CreateStudentDto);
      this.created(res, dto);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = await this.students.updateStudent(req.params.id, req.body as UpdateStudentDto);
      this.ok(res, dto);
    } catch (e) {
      next(e);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.students.deleteStudent(req.params.id);
      this.success(res);
    } catch (e) {
      next(e);
    }
  };
}

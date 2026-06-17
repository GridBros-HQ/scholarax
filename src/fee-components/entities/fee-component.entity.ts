export class FeeComponentEntity {
  id: string;
  campusId: string;
  name: string;
  description?: string;
  amount: number;
  isMandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
}
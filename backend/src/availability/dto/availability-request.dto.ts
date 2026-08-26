import { IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class AvailabilityRequestDto {
  @IsString()
  @MaxLength(120)
  experienceId: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'requestedDate must use YYYY-MM-DD format',
  })
  requestedDate: string;

  @IsInt()
  @Min(1)
  @Max(50)
  travellers: number;
}

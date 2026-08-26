import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  sender: 'user' | 'assistant';

  @IsString()
  @MaxLength(2000)
  text: string;
}

export class ChatRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
  })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}

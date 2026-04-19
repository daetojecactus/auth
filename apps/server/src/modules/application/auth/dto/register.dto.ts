import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores and hyphens',
  })
  username!: string

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string
}

import { BadRequestException } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsInt } from "class-validator";
import { createGlobalValidationPipe } from "./global-validation.pipe.js";

class CountDto {
  @Type(() => Number)
  @IsInt()
  count!: number;
}

describe("createGlobalValidationPipe", () => {
  it("converts query values to their declared DTO type", async () => {
    const result = await createGlobalValidationPipe().transform(
      { count: "4" },
      { type: "query", metatype: CountDto, data: undefined },
    );

    expect(result).toEqual({ count: 4 });
    expect((result as CountDto).count).toBe(4);
  });

  it("rejects properties that are not declared in the DTO", async () => {
    await expect(
      createGlobalValidationPipe().transform(
        { count: "4", extra: "x" },
        { type: "query", metatype: CountDto, data: undefined },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

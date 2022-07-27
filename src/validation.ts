import { isRight } from 'fp-ts/lib/Either';
import * as iots from 'io-ts';

export const isValidType = <T extends iots.Type<any, any, any>>(
	type: T,
	input: unknown,
): input is iots.TypeOf<T> => isRight(type.decode(input));

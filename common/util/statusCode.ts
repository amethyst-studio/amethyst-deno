
export enum StatusCode {
  OK = 'OK',
  BadRequest = 'BAD_REQUEST',
  Conflict = 'CONFLICT',
  InternalServerError = 'INTERNAL_SERVER_ERROR'
}

export enum StatusCodeNumeric {
  'OK' = 200,
  'BAD_REQUEST' = 400,
  'CONFLICT' = 409,
  'INTERNAL_SERVER_ERROR' = 500,
}

export enum StatusMessage {
  'OK' = 'Request was successful.',
  'BAD_REQUEST' = 'Request failed due to one or more validation exceptions while processing this request.',
  'CONFLICT' = 'Request failed due to one or more conflicting state exceptions while processing this request.',
  'INTERNAL_SERVER_ERROR' = 'Request failed due to one or more unexpected exceptions while processing this request.',
}

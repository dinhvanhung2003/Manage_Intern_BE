export function successResponse(data: any, message = "Thành công!") {
  return {
    status: 200,
    result: 0,
    message,
    data,
    error: null
  };
}

export function errorResponse(error: any, message = "Thất bại!") {
  return {
    status: 400,
    result: 1,
    message,
    data: null,
    error
  };
}

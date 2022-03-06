// append: add key=value if key does not exists in file
// appendOverride: add key=value, override file if key exists
// write: delete file contents and add new key=value pairs
export type Strategy = "append" | "write" | "appendOverride";
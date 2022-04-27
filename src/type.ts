export type MessageType = {
  target: LeafType;
  type: mType;
  data?: { [key: string]: any };
  status: MessageStatus;
  vid: number;
};

export enum mType {
  'version' = 'version',
  'action' = 'action',
}

export type SubscriberType = {
  unsubscribe: () => void;
};

export type LeafType = {
  value: any;
  base: any;
  vid: number;
  next: (change: any) => void;
  complete: () => void;
  subscribe: (
    listener: (
      value: any
    ) => void | {
      next: (value: any) => void;
      complete: () => void;
    }
  ) => SubscriberType;
  parent?: LeafType;
  root: LeafType;
};

export enum MessageStatus {
  candidate = 'version:candidate',
  confirmed = 'version:confirmed',
  cancelled = 'version:cancelled',
}

export type TestFnType = (value: any, target: LeafType) => any;

export type childrenType = Map<any, any> | { [key: string | number]: any };

export type LeafOptionsType = {
  test?: TestFnType | TestFnType[];
  parent?: LeafType | null;
  children?: childrenType;
};

export enum TransTokenType {
  TRANS_TOKEN_VERSION = 'transToken:version',
  TRANS_TOKEN_ACTION = 'transToken:action',
}

export type scalarType = number | string | symbol | null;
export type mapType = Map<any, any>;
export type arrayType = Array<any>;
export type objectType = NonNullable<Record<any, any>>;

export type structuredType = NonNullable<mapType | arrayType | objectType>;

export type valueType = scalarType | structuredType;

export type formIDType = symbol;

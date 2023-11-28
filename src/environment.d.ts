declare global {
  namespace NodeJS {
    interface ProcessEnv {
      __DEV__: string;
      __FIREFOX__: string;
    }
  }

  interface Document {
    caretPositionFromPoint?(
      x: number,
      y: number,
    ): { offsetNode: Node; offset: number };
  }
}

export {};

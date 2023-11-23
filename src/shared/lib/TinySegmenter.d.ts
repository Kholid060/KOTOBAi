interface TinySegmenter {
  segment(input: string): string[];
}

interface TinySegmenterConstructor {
  new (): TinySegmenter;
  (): void;
}

const TinySegmenter: TinySegmenterConstructor = function() {};

export default TinySegmenter;
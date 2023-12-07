import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import { useEffectOnce } from 'usehooks-ts';
import dictDB from '@root/src/shared/db/dict.db';

const Newtab = () => {
  useEffectOnce(() => {
    console.log(dictDB);
  });

  return (
    <div>
      <p>Hello world</p>
    </div>
  );
};

export default withErrorBoundary(
  withSuspense(Newtab, <div> Loading ... </div>),
  <div> Error Occur </div>,
);

import React from 'react';
import universal from '../../../src';

function resolveLunchOrder(order) {
  if (order === null) {
    return Promise.reject(new Error('order must be a number'));
  }
  return new Promise((resolve, reject) => setTimeout(() => resolve(order + 1), 500));
}

const shouldComponentReload = (oldCnt, newCnt) => newCnt !== 3;

const loader = universal('lunch', props => props.lunchOrder, resolveLunchOrder, {
  shouldComponentReload,
});

const Home = loader(({ lunch, lunchReady, lunchError }) =>
  lunchReady ? (
    <div style={lunchError ? {backgroundColor: 'red'} : {}}>Lunches eaten {lunch} {lunchError && lunchError.message}</div>
  ) : (
    <div>Loading</div>
  )
);

export default Home;

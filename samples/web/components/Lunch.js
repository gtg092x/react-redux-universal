import React from 'react';
import iso from '../../../src';

function resolveLunchOrder(order) {
  if (order === null) {
    return Promise.reject(new Error('order must be a number'));
  }
  return new Promise((resolve, reject) => setTimeout(() => resolve(order + 1), 500));
}

const loader = iso('lunch', props => props.lunchOrder, resolveLunchOrder);

const Home = loader(({ lunch, lunchReady, lunchError }) =>
  lunchReady ? (
    <div style={lunchError ? {backgroundColor: 'red'} : {}}>Home {lunch} {lunchError && lunchError.message}</div>
  ) : (
    <div>Loading</div>
  )
);

export default Home;

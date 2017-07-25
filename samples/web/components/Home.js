import React from 'react';
import Lunch from './Lunch';

class Home extends React.Component {
  constructor() {
    super();
    this.state = {
      count: 0,
    };
    this.increment = () => this.setState({
      count: this.state.count === null ? 0 : this.state.count + 1,
    });
    this.error = () => this.setState({ count: null });
  }
  render() {
    return (
      <div>
        <button onClick={this.increment}>More</button>
        <button onClick={this.error}>Error</button>
        <Lunch lunchOrder={this.state.count} />
      </div>
    );
  }
}

export default Home;
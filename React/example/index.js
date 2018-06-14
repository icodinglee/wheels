import Tinyact, { render, Component } from "../tinyact";

class Title extends Component {
  componentDidMount() {
    console.log(this.props);
  }

  render() {
    return (
      <h1 id="title"> {this.props.children}</h1>
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { counter: 0 };

    this.onIncrease = this.onIncrease.bind(this);
    this.onDecrease = this.onDecrease.bind(this);
  }

  componentDidMount() {
    console.log(this.counter);
  }

  onIncrease() {
    this.setState({
      counter: this.state.counter + 1
    })
  }

  onDecrease() {
    this.setState({
      counter: this.state.counter - 1
    })
  }

  render() {
    const { counter } = this.state;
    return (
      <div>
        <Title data={'H-E-L-L-O'}>Tinyact</Title>
        <p  ref={(counter) => this.counter = counter }>
          <button onClick={this.onDecrease} style={{color: 'red'}}>-</button>
          {" "}Counter: {counter}{" "}
          <button onClick={this.onIncrease} style={{color: 'blue'}}>+</button>
        </p>
      </div>
    );
  }
}


render(<App />, document.getElementById("root"));
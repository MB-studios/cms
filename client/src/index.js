import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from './store';
import App from './App';

// import 'bootstrap/dist/css/bootstrap.min.css';
//import 'bootswatch/dist/darkly/bootstrap.min.css';
import './style.scss';

ReactDOM.render(
	<React.StrictMode>
		<Provider store={store}>
			<App />
		</Provider>
	</React.StrictMode>,
	document.getElementById('root')
);

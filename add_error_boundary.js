const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'client/src/pages/Centros.jsx');
let content = fs.readFileSync(file, 'utf8');

const errorBoundaryCode = `
class ModalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'red', color: 'white', padding: '2rem' }}>
          <h2>Algo salió mal en el Modal:</h2>
          <pre>{this.state.error.toString()}</pre>
          <pre>{this.state.error.stack}</pre>
          <button onClick={() => this.setState({ hasError: false })}>Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
`;

if (!content.includes('ModalErrorBoundary')) {
  content = content.replace('export default function Centros() {', errorBoundaryCode + '\nexport default function Centros() {');
  
  // Wrap DonationModal rendering in ErrorBoundary
  content = content.replace('{donatingTo && (', '{donatingTo && (\n        <ModalErrorBoundary>');
  content = content.replace('<DonationModal centro={donatingTo}', '<DonationModal centro={donatingTo}');
  content = content.replace(/<DonationModal centro=\{donatingTo\}[\s\S]*?\/>/, match => match + '\n        </ModalErrorBoundary>');
  
  fs.writeFileSync(file, content);
  console.log("ErrorBoundary added");
} else {
  console.log("ErrorBoundary already present");
}

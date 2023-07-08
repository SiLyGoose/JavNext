// Layout component shared across all pages
// import styles from './layout.module.css';

function Layout({ children }) {
	return (
        <html lang="en">
            {children}
        </html>
    );
}

export default Layout;
# wa-sqlite-httpvfs

This project implements the lazy-fetching, HTTP-based Virtual File System (VFS) logic originally pioneered by `sql.js-httpvfs`, powered by the modern `wa-sqlite` library.

## Acknowledgements & Attribution

This project would not be possible without the foundational work of two incredible open-source projects:

- [**sql.js-httpvfs**](https://github.com/phiresky/sql.js-httpvfs): For the original concept and logic of hosting SQLite databases on static file hosts using HTTP Range requests.

- [**wa-sqlite**](https://github.com/rhashimoto/wa-sqlite): For providing the robust WebAssembly SQLite environment and VFS interfaces used in this implementation.

## Demo

To launch the local demo web application and see the VFS in action, you can use `pnpm`:

```bash
# Install dependencies
pnpm install

# Launch the demo web server
pnpm dev
```

## Features

## Installation

```bash
pnpm add rhashimoto/wa-sqlite#v1.2.0
pnpm add tc-yu/wa-sqlite-httpvfs
```

## Usage

## API Reference

## Building the Database (Page Size & Chunking)

```
pnpm prepare_db <path-to-db-file>
```

## Contributing

## License

This project is licensed under the BSD License - see the [LICENSE](LICENSE) file for details.

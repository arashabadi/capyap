"""User-facing capyap command line interface."""

from __future__ import annotations

import argparse
import sys


def build_parser() -> argparse.ArgumentParser:
    """Build parser for capyap utility commands."""
    parser = argparse.ArgumentParser(
        prog="capyap",
        description="Capyap local app launcher.",
    )

    subparsers = parser.add_subparsers(dest="command")

    start_parser = subparsers.add_parser(
        "start",
        help="Start local web app and open it in your browser.",
    )
    start_parser.add_argument("--host", default="127.0.0.1")
    start_parser.add_argument("--port", type=int, default=8000)
    start_parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Start server without auto-opening a browser tab.",
    )

    return parser


def main() -> None:
    """Entrypoint for capyap command."""
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "start":
        try:
            from .capyap_start import start_local_server

            start_local_server(
                host=args.host,
                port=args.port,
                open_browser=not args.no_browser,
            )
        except (RuntimeError, ModuleNotFoundError) as exc:
            print(f"Error: {exc}", file=sys.stderr)
            print(
                "Tip: run `conda env create -f capyap.yml` then `conda activate capyap`.",
                file=sys.stderr,
            )
            raise SystemExit(1) from exc
        return

    parser.print_help()
    raise SystemExit(1)


if __name__ == "__main__":
    main()

# Mornington Crescent Interactive Debugger

Watch the execution of [Mornington Crescent](https://esolangs.org/wiki/Mornington_Crescent) programs as they traverse the London Tube network, pause and step through syntax-highlighted code.

This project contains two main components:

- The Mornington Crescent interpreter and debugging renderer;
- A module for directly interacting with the Tube map SVG, as provided by Transport for London.

![Running Hello World](http://i.imgur.com/hzypjwh.gif)

## Requirements

This project is written in vanilla ES2015 with no external dependencies, and has been tested as running directly in Chromium 51 and Firefox 48; other browsers may have issues interpreting the syntax.

## Known Issues

- The TfL Tube map denotes stations with a three-letter code as part of a longer ID; the three-letter codes for Wood Lane (on the Circle line) and Woolwich Arsenal (on the DLR) are the same, so the syntax highlighter may refer to one as the other.
- For a similar reason, Hammersmith has two codes and any data written to Hammersmith (via Bank/Monument) will appear twice in the memory dumper.
- The included module for handling the Tube map has the data to create routes across Tube lines (through interchanges), but this functionality does not yet exist.
- Breakpoints cannot be set: an MCresc script will run to completion unless paused manually.
- The debugger is currently hardcoded to load a Hello World script.
- Live editing of the source code is not currently supported.

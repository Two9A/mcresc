// Mornington Crescent Interactive Debugger, Imran Nazar, 2016
// Tube Map SVG loader and highlighter

// TODO: Navigation across the network, through interchanges

class TubeMap {
    constructor(container) {
        this.container = container;
        this.stationCodes = {};
        this.stationNames = {};
        this.lineCodes = {};
        this.lineNames = {};
        this.lines = {};

        // Some station names are broken over multiple lines
        // in the SVG, which turn into extraneous spaces
        this.stationCorrections = {
            'Bromley- by-Bow': 'Bromley-by-Bow',
            'Harrow- on-the-Hill': 'Harrow-on-the-Hill',
            'Heathrow T erminals 2 & 3': 'Heathrow Terminals 1, 2, 3',
            'S t . Jam e s ’ s Park': "St. James's Park"
        }
    }

    fetch(url) {
        let apiId = 'ee45c61f';
        let apiKey = 'bef45f24a7cd465a00944b699b54693f';
        return XHR(url + '&app_id=' + apiId + '&app_key=' + apiKey);
    }

    load() {
        return new Promise((resolve, reject) => {
            this.fetch('https://tfl.gov.uk/Modules/TubeMap?nightMode=false&overrideNightMap=false').then((svg) => {
                document.getElementById('mcresc-map').innerHTML = svg;
                [].forEach.call(document.querySelectorAll(this.container + ' g.line *'), (node) => {
                    node.classList.add('segment-inactive');
                });
                this.parseStations();
                this.parseLines();

                // Special case! Bank is connected to Monument
                this.stationCodes['Bank'].push('mmt');
                this.stationCodes['Monument'].push('bnk');

                resolve();
            });
        });
    }

    parseStations() {
        [].forEach.call(document.querySelectorAll(this.container + ' #station-names *'), (node) => {
            if (node.id) {
                // Station IDs are called "Naptan" IDs, and start with 9
                // Some stations have multiple IDs
                let id, re = /(9[0-9a-z]+)_/g;
                while (id = re.exec(node.id)) {
                    id = id[1].substr(-3);
                    let name = node.textContent.replace(/\s+/g, ' ').trim();
                    if (typeof this.stationCodes[id] === 'undefined' && name.length) {
                        if (this.stationCorrections[name]) {
                            name = this.stationCorrections[name];
                        }
                        name = name.replace('’', "'");
                        this.stationNames[id] = name;
                    }
                    if (typeof this.stationCodes[name] === 'undefined') {
                        this.stationCodes[name] = [];
                    }
                    if (this.stationCodes[name].indexOf(id) === -1) {
                        this.stationCodes[name].push(id);
                    }
                }
            }
        });
    }

    parseLines() {
        [].forEach.call(document.querySelectorAll(this.container + ' svg > g'), (line) => {
            let lineType, rest;
            [lineType, ...rest] = line.id.split('-');
            switch (lineType) {
                case 'tram':
                case 'tfl':
                case 'raillo':
                case 'dlr':
                case 'lul':
                    let lineName = rest;
                    let lineId = rest.join('-');
                    this.lines[lineId] = {
                        type: lineType,
                        segments: {}
                    };

                    // Build a readable name for this line
                    for (let i in lineName) {
                        lineName[i] = lineName[i].toLowerCase();
                        lineName[i] = lineName[i].replace(/^\w/, c => c.toUpperCase());
                    }
                    this.lineNames[lineId] = lineName.join(' and ');
                    this.lineCodes[lineName.join(' and ')] = lineId;

                    // Pull all elements that look like line segments
                    let segments = [], stations = [];
                    [].forEach.call(line.querySelectorAll('*'), (track) => {
                        this.parseSegment(lineId, track, segments);
                    });
                    for (let i in segments) {
                        let seg = segments[i];
                        this.lines[lineId].segments[seg.from + '-' + seg.to] = seg.segmentId;
                        if (stations.indexOf(seg.from) === -1) {
                            stations.push(seg.from);
                        }
                        if (stations.indexOf(seg.to) === -1) {
                            stations.push(seg.to);
                        }
                    }

                    // Build an adjacency matrix, where each station
                    // is adjacent to itself
                    this.lines[lineId].adjMatrix = {};
                    stations.forEach((station) => {
                        this.lines[lineId].adjMatrix[station] = {};
                        stations.forEach((substation) => {
                            this.lines[lineId].adjMatrix[station][substation] = false;
                        });
                        this.lines[lineId].adjMatrix[station][station] = true;
                    });

                    // Run over the segments again, now we have
                    // a full list of stations, and connect them
                    for (let seg in this.lines[lineId].segments) {
                        let from, to;
                        [from, to] = seg.split('-');
                        this.lines[lineId].adjMatrix[from][to] = true;
                        this.lines[lineId].adjMatrix[to][from] = true;
                    }
                    break;

                // This would include blocks like "station-names",
                // "interchange-circles" and lines we don't need
                default:
                    break;
            }
        });
    }

    parseSegment(lineId, track, segments) {
        if (track.id) {
            let trackId = track.id.match(/^([a-z-]+)_(9[0-9a-z]+)_(9[0-9a-z]+)/);
            if (trackId && trackId[1] && trackId[2] && trackId[3]) {
                if (trackId[1] === (this.lines[lineId].type + '-' + lineId)) {
                    let from = trackId[2].substr(-3);
                    let to = trackId[3].substr(-3);
                    segments.push({
                        segmentId: track.id,
                        from: from,
                        to: to
                    });
                }
            }
        }
    }

    hasStation(line, station) {
        if (!this.lines[line]) {
            return false;
        }
        return (typeof this.lines[line].adjMatrix[station] !== 'undefined');
    }

    getPath(line, from, to) {
        if (this.hasStation(line, from) && this.hasStation(line, to)) {
            let visited = {}, paths = [[from]];
            let found = false;
            visited[from] = true;
            while (found === false) {
                // Take the next stop on each path, if there is a next stop
                for (let path in paths) {
                    let nextStations = [];
                    let thisStation = paths[path][paths[path].length - 1];
                    if (thisStation != '---') {
                        for (let station in this.lines[line].adjMatrix[thisStation]) {
                            if (this.lines[line].adjMatrix[thisStation][station]) {
                                if (!visited[station]) {
                                    nextStations.push(station);
                                }
                            }
                        }

                        // There are three possible outcomes from the matrix
                        if (!nextStations.length) {
                            // Every eligible stop was already visited
                            // End of line
                            paths[path].push('---');
                        } else if (nextStations.length == 1) {
                            // Only one stop was not already visited
                            // It's the next stop for this path
                            paths[path].push(nextStations[0]);
                        } else {
                            // There are multiple stops from here
                            // Build 2nd and subsequent paths
                            for (let i = 1; i < nextStations.length; i++) {
                                let newPath = paths[path].slice(0);
                                newPath.push(nextStations[i]);
                                paths.push(newPath);
                            }
                            paths[path].push(nextStations[0]);
                        }

                        // We've been to all of those stations now
                        nextStations.forEach((station) => {
                            visited[station] = true;
                        });
                    }
                }
                
                // All paths are extended by one stop; some may
                // have reached either the end or the desired stop
                let endedPaths = 0;
                for (let path in paths) {
                    if (paths[path][paths[path].length - 1] === to) {
                        found = path;
                        break;
                    }
                    if (paths[path][paths[path].length - 1] === '---') {
                        endedPaths++;
                    }
                }
                if (endedPaths === paths.length) {
                    // No paths contain the destination
                    return false;
                }
            }
            return paths[found];
        }
        return false;
    }

    toggleSegment(line, from, to, value = undefined) {
        let seg = from + '-' + to, revSeg = to + '-' + from;
        let node = document.querySelector('#' + this.lines[line].segments[seg] + ', #' + this.lines[line].segments[revSeg]);
        if (value === true) {
            node.classList.remove('segment-inactive');
            node.classList.add('segment-active');
            [].forEach.call(node.querySelectorAll('*'), (subnode) => {
                subnode.classList.remove('segment-inactive');
                subnode.classList.add('segment-active');
            });
        } else if (value === false) {
            node.classList.add('segment-inactive');
            node.classList.remove('segment-active');
            [].forEach.call(node.querySelectorAll('*'), (subnode) => {
                subnode.classList.add('segment-inactive');
                subnode.classList.remove('segment-active');
            });
        } else {
            node.classList.toggle('segment-inactive');
            node.classList.toggle('segment-active');
            [].forEach.call(node.querySelectorAll('*'), (subnode) => {
                subnode.classList.toggle('segment-inactive');
                subnode.classList.toggle('segment-active');
            });
        }
    }

    // Hide every segment on the given line
    hide(line) {
        if (this.lines[line]) {
            let from, to;
            for (let seg in this.lines[line].segments) {
                [from, to] = seg.split('-');
                this.toggleSegment.call(this, line, from, to, false);
            }
        }
    }

    // Hide every segment on all lines
    hideAll() {
        for (let line in this.lines) {
            this.hide(line);
        }
    }

    // Highlight a segment of a line, if the stations are on that line
    show(line, from, to) {
        let path = this.getPath(line, from, to);
        if (path) {
            for (let i = 0; i < path.length - 1; i++) {
                this.toggleSegment.call(this, line, path[i], path[i+1], true);
            }
        }
    }
}

# Probe Dock RT

> Lightweight [Probe Dock](https://github.com/probedock/probedock). Aims to help developers in their daily work. Run tests, filter tests, get real time results in your browser.

## Installation

```bash
$> npm install -g probedock-rt
```

Create the configuration file in `probedock-rt.yml` in `~/.probedock` with this content:

```yml
host: 127.0.0.1
port: 1337
```

| Name         | Description         |
| ------------ | ------------------- |
| host         | The host is used by clients to connect to Probe Dock RT agent |
| port         | The port is used by clients to connect to Probe Dock RT agent and by the web server of the agente to listen on it |

## Usage

```bash
$> probedock-rt
```

Open your browser and reach [http://localhost:1337](http://localhost:1337) or change the port accordingly to your configuration file.

### Requirements

* Node.js 0.10+

## Contributing

* [Fork](https://help.github.com/articles/fork-a-repo)
* Create a topic branch - `git checkout -b feature`
* Push to your branch - `git push origin feature`
* Create a [pull request](http://help.github.com/pull-requests/) from your branch

Please add a changelog entry with your name for new features and bug fixes.

## License

**probedock-rt** is licensed under the [MIT License](http://opensource.org/licenses/MIT).
See [LICENSE.txt](LICENSE.txt) for the full text.

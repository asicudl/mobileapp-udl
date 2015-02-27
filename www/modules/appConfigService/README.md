# Configuration Service

In the configuration service you can play with two files.
* default-config.json: Present in the repo, could be uses as real configuration or a sample for the real one.
* config.json: Not present in the repo. Used to store real app configuration.

Configuration services looks for default-config.json to get the configuration if config.json not found. The last one could be used to load the real configuration in local or build instances to have real values of configuration that you don't want to publish in the repo.


// DEPENDENCIES
const chalk = require('chalk');
const PrettyError = require('pretty-error');
const pe = new PrettyError();
const path = require('path');
const Promise = require('bluebird');
const fs = require('fs');

// MODULE DEPENDENCIES
const {
	get_artists_by_track_by_playlist,
	get_audio_analysis_by_playlist_stream,
	get_audio_features_by_playlist,
	get_related_artists,
	get_playlists,
} = require('../get_spotify');

// CONSTANTS
const {
	toy_id_file,
	toy_playlists_full,
	toy_playlists_audio_analysis,
	toy_playlists_audio_features,
	audio_features_errors,
	audio_analysis_errors,
	toy_playlists_artists,
	artists_errors,
	toy_playlists_related_artists,
	results_dir,
} = require('./constants');

const split_dataset = require('../db/seeder-helpers/split-dataset')(80, 'spotify_toy_data_set');

// SCRIPTS TO RUN
const scripts = [
	[get_playlists, [toy_id_file, toy_playlists_full]],
	[get_artists_by_track_by_playlist, [toy_playlists_full, toy_playlists_artists, artists_errors]],
	[get_related_artists, [toy_playlists_artists, toy_playlists_related_artists]],
	[get_audio_analysis_by_playlist_stream, [toy_playlists_full, toy_playlists_audio_analysis, audio_analysis_errors]],
	[get_audio_features_by_playlist, [toy_playlists_full, toy_playlists_audio_features, audio_features_errors]]
];

// run in order
const main = async () => {	
	let err_flag = false;
	if (!fs.existsSync(path.resolve(results_dir))) {
		fs.mkdirSync(path.resolve(results_dir));
	}
	const args = process.argv.slice(2);
	try {
		if (args.length > 0) {
			const arg = args[0];
			if (arg == 'help') {
				console.log('[0] get_playlists');
				console.log('[1] get_artists');
				console.log('[2] get_related_artists');
				console.log('[3] get_audio_analyses');
				console.log('[4] get_audio_features');
				console.log('[5] split_dataset');
				process.exit(0);
			} else if (arg == 5) {
				await split_dataset.up();
			} else {
				const func = scripts[parseInt(arg)][0];
				const func_args = scripts[parseInt(arg)][1];
				await func(...func_args);
			}			
		} else {
			console.log('Fetching entire toy set. This may take some time...');
			await Promise.each(scripts, ([script, args]) => script(...args));
		}
	} catch (err) {
		console.error(pe.render(err));
		err_flag = true;
	}
	console.log(err_flag ? chalk.red('Completed with errors.') : `[${chalk.green(path.resolve(results_dir))}] Toy set JSON fetch complete.`);
	process.exit(0);
};

if (require.main === module) {
	main();
}

module.exports = main;

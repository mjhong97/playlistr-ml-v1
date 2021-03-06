// DEPENDENCIES
const chalk = require('chalk');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const PrettyError = require('pretty-error');
const pe = new PrettyError();

// CONSTANTS
const { getTrackAudioFeaturesConfig } = require('./util');
const batchSizeLimit = 100;

// MAIN FUNCTION
const main = async (playlists_json_file, outfile, err_file) => {
	const toy_set = JSON.parse(await fs.readFileAsync(playlists_json_file));
	const api_instance = await require('../api_manager').spotify();
	const track_ids = toy_set.reduce((track_arr, current_playlist) => {
		track_arr.push(...current_playlist.tracks.map(playlist_track => playlist_track.track.id));
		return track_arr;
	}, []).reduce((grouped_arrays, track_id, idx) => {
		const outer_index = Math.floor(idx / batchSizeLimit);
		if (typeof grouped_arrays[outer_index] === 'undefined') {
			grouped_arrays[outer_index] = [];
		} else {
			grouped_arrays[outer_index].push(track_id);
		}
		return grouped_arrays;
	}, []);
	return Promise.map(track_ids, id_array => Promise.all([id_array.filter(id => id), api_instance.request(getTrackAudioFeaturesConfig(id_array))]).catch(err => {
		console.error(chalk.red(`Error occurred, request ${err.config.url}`));
		return Promise.resolve([id_array, false]);
	}), { concurrency: 4 })
		.then(results => results.reduce((result_obj, batch_result) => {
			if (!result_obj.failed_batches) result_obj.failed_batches = [];
			if (!result_obj.success_ids) result_obj.success_ids = {};
			if (!batch_result[1]) {
				// error occurred on this batch, push to error object
				result_obj.failed_batches.push(batch_result[0]);
			} else {
				//console.log(batch_result[1]);
				batch_result[0].forEach((id, idx) => {
					result_obj.success_ids[id] = batch_result[1].audio_features[idx];
				});
			}
			return result_obj;
		}, {}))
		.then(result_obj => {
			return Promise.all([
				fs.writeFileAsync(outfile, JSON.stringify(result_obj.success_ids))
					.then(() => console.log(`[${chalk.green(outfile)}] Wrote audio features to file for tracks: ${chalk.green(Object.keys(result_obj.success_ids).length)}`)),
				Promise.resolve(result_obj.failed_batches).then(failed_batches => {
					if (failed_batches.length > 0) {
						return fs.writeFileAsync(err_file, JSON.stringify(failed_batches))
							.then(() => console.log(`[${chalk.red(err_file)}] Failed batches written to err file: ${chalk.red(failed_batches.length)}`));
					}
					return Promise.resolve();
				}),
			]);
		})
		.catch(err => console.error(pe.render(err)));
};

if (require.main === module) {
	main();
}

module.exports = main;
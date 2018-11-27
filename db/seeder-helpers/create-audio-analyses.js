/*jshint esversion: 6, node: true*/
'use strict';

// DEPENDENCIES
const chalk = require('chalk');
const fs = require('fs');
const Chain = require('stream-chain');
const { parser } = require('stream-json');
const { streamObject } = require('stream-json/streamers/StreamObject');
const PrettyError = require('pretty-error');
const pe = new PrettyError();
const models = require('../models');
const AudioAnalysis = models.AudioAnalysis;

// CONSTANTS
const user_path = '../get_user_set/results/user_data_set_tracks_audio_analysis.json';
const Promise = require('bluebird');
const include_keys = [
	'duration',
	'loudness',
	'tempo',
	'tempo_confidence',
	'time_signature',
	'time_signature_confidence',
	'key',
	'key_confidence',
	'mode',
	'mode_confidence',
];

module.exports = (data_file) => {

	if (!fs.existsSync(data_file)) throw new Error(`[${data_file}] Data file not found.`);
	console.log(`[${chalk.yellow(data_file)}] Starting seed with audio analysis data file...`);

	return {
		up: (queryInterface, Sequelize) => {
			return new Promise((resolve, reject) => {
				console.log('Starting...');
				let count = 0;
				const pipeline = new Chain([
					fs.createReadStream(data_file),
					parser({ streamValues: false }),
					streamObject(),
					chunk => {
						const data = chunk.value.track;
						const analysis = Object.assign(Object.keys(data).reduce((a, key) => {
							if (include_keys.includes(key)) a[key] = data[key];
							return a;
						}, {}), { trackId: chunk.key, createdAt: new Date(), updatedAt: new Date() });
						return AudioAnalysis.bulkCreate([analysis], { ignoreDuplicates: true })
							.then(() => {
								count = count + 1;
								console.log(`Loaded analysis: ${chunk.key}`);
							})
							.catch(err => {
								console.error(pe.render(err));
								return Promise.resolve();
							});
					},
				]);
				pipeline.on('error', err => console.log(pe.render(err)));
				pipeline.on('finish', () => resolve(console.log(`${chalk.green('JSON Stream complete.')} Loaded analysis for tracks: ${chalk.green(count)}`)));
			});
		},
		down: (queryInterface, Sequelize) => {
			/*
			  Add reverting commands here.
			  Return a promise to correctly handle asynchronicity.

			  Example:
			  return queryInterface.bulkDelete('Person', null, {});
			*/
			return queryInterface.bulkDelete('AudioAnalyses', null, {})
				.then(() => console.log('Removed audio analyses.'));
		}
	};
};
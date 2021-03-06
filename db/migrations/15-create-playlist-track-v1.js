'use strict';
module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.createTable('playlist_track', {
			id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true,
			},
			playlistId: {
				type: Sequelize.TEXT,
				allowNull: false,
				references: {
					model: 'Playlists',
					key: 'id',
				}
			},
			trackId: {
				type: Sequelize.TEXT,
				allowNull: false,
				references: {
					model: 'Tracks',
					key: 'id',
				}
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE
			}
		}).then(() => queryInterface.addConstraint('playlist_track', ['playlistId', 'trackId'], {
			type: 'unique',
			name: 'playlist_track_unique',
		}));
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.dropTable('playlist_track');
	}
};
'use strict';
module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.createTable('track_external_id', {
			id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true,
			},
			externalId: {
				type: Sequelize.TEXT,
				allowNull: false,
				references: {
					model: 'ExternalIds',
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
		}).then(() => queryInterface.addConstraint('track_external_id', ['externalId', 'trackId'], {
			type: 'unique',
			name: 'track_external_id_unique',
		}));
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.dropTable('track_external_id');
	}
};
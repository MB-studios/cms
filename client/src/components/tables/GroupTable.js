import React, { useEffect } from 'react';
import { useFilters, useSortBy, useTable } from 'react-table';
import BTable from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { loadGroups, setGroupAccess } from '../../actions/groups';
import { DefaultColumnFilter, SelectColumnFilter } from '../../utils/react-tableFilters';
import accessTypes from '../../config/accessTypes';

// TODO Bör ligga i nån språkfil i förlängningen
const noAccess = 'Ingen access';
const readAccess = 'Läsaccess';
const writeAccess = 'Skrivaccess';
const fullAccess = 'Full access';

const GroupTable = ({ loadGroups, setGroupAccess, groups, groupsLoading }) => {
	const AccessButton = (cell) => {
		return (
			<div>
				<Form.Control
					as="select"
					size="sm"
					defaultValue={cell.value}
					onChange={(event) => {
						setGroupAccess({
							group: cell.row.original._id,
							type: cell.column.id,
							read: event.target.value === fullAccess || event.target.value === readAccess,
							write: event.target.value === fullAccess || event.target.value === writeAccess,
						});
					}}
				>
					<option value={noAccess}>{noAccess}</option>
					<option value={readAccess}>{readAccess}</option>
					<option value={writeAccess}>{writeAccess}</option>
					<option value={fullAccess}>{fullAccess}</option>
				</Form.Control>
			</div>
		);
	};

	const columnsArray = [
		{
			Header: 'Namn',
			accessor: 'name',
		},
		{
			id: 'defaultGroup',
			Header: 'Standardgrupp',
			accessor: (d) => {
				return d.defaultGroup ? 'Standard' : 'Ej standard';
			},
			Filter: SelectColumnFilter,
			filter: 'includes',
		},
	];

	useEffect(() => {
		async function getGroups() {
			await loadGroups();
		}
		getGroups();
	}, [loadGroups]);

	const data = React.useMemo(() => groups, [groups]);

	const findAccessTypeInArray = (accessArray, access) => {
		let matched = accessArray.filter((a) => {
			return a.type === access;
		});

		if (!matched || matched.length !== 1) {
			return noAccess;
		} else if (matched[0].read && matched[0].write) {
			return fullAccess;
		} else if (matched[0].read) {
			return readAccess;
		} else if (matched[0].write) {
			return writeAccess;
		}
	};

	const columns = React.useMemo(
		() =>
			columnsArray.concat(
				Object.entries(accessTypes)
					.map((access) => {
						return access[1];
					})
					.map((access) => {
						return {
							Header: access,
							accessor: (d) => findAccessTypeInArray(d.access, access),
							Cell: ({ cell }) => {
								return AccessButton(cell);
							},
							Filter: SelectColumnFilter,
							filter: 'includes',
						};
					})
			),
		[accessTypes]
	);

	const defaultColumn = React.useMemo(
		() => ({
			Filter: DefaultColumnFilter,
		}),
		[]
	);

	const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
		{ columns, data, defaultColumn },
		useFilters,
		useSortBy
	);

	return (
		<BTable {...getTableProps()} className="groupTable" bg="dark" variant="dark">
			<thead>
				{headerGroups.map((headerGroup) => (
					<tr {...headerGroup.getHeaderGroupProps()}>
						{headerGroup.headers.map((column) => (
							<th {...column.getHeaderProps()}>
								<div {...column.getHeaderProps(column.getSortByToggleProps())}>
									{column.render('Header')}
									<span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
								</div>
								<div className="groupTableFilter">{column.canFilter ? column.render('Filter') : null}</div>
							</th>
						))}
					</tr>
				))}
			</thead>
			<tbody {...getTableBodyProps()}>
				{rows.map((row) => {
					prepareRow(row);
					return (
						<tr {...row.getRowProps()}>
							{row.cells.map((cell) => {
								return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
							})}
						</tr>
					);
				})}
			</tbody>
		</BTable>
	);
};

GroupTable.propTypes = {
	loadGroups: PropTypes.func.isRequired,
	setGroupAccess: PropTypes.func.isRequired,
	groups: PropTypes.array.isRequired,
	groupsLoading: PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => {
	//console.log(state.users);
	return {
		groups: state.groups.groups,
		groupsLoading: state.groups.loading,
	};
};

export default connect(mapStateToProps, { loadGroups, setGroupAccess })(GroupTable);

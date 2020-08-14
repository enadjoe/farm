<script>
    export let playerLocations, playerInfo, grid;
</script>
<div class="container">
    <table>
        <thead>
            <tr>
                <td>Name</td>
                <td>StreamId</td>
                <td>SocketId</td>
                <td>Position</td>
                <td>Distance</td>
            </tr>
        </thead>
        <tbody>
            {#each Object.entries(playerInfo) as [id,info], p}
            <tr>
                <td>{info.name}</td>
                <td>{info.stream}</td>
                <td>{info.socket}</td>
                <td>{playerLocations[id]}</td>
                <td>{grid[playerLocations[id][0]][playerLocations[id][1]].distance}</td>
            </tr>
        {/each}

    </tbody>
    </table>

</div>

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
	}

    table, td {
        border: 1px solid #623cea;
        color: #623cea;
    }
</style>
<script>
    export let playerScores, playerInfo;
</script>
<div class="container">
    <table>
        <thead>
            <tr>
                <td>Name</td>
                <td>Score</td>
            </tr>
        </thead>
        <tbody>
            {#each Object.entries(playerScores) as [id,score], p}
            <tr>
                <td>{playerInfo[id].name || 'undefined'}</td>
                <td>{score}</td>
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